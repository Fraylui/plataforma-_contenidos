package pe.plataformacontenidos.identity;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.InvalidPermissionException;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.permission.WorkerPermission;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import pe.plataformacontenidos.identity.security.RefreshTokenService;

/**
 * Trabajadores del panel (spec 2a §5): alta con contraseña temporal,
 * permisos por módulo, restablecer contraseña y activar/desactivar. Solo
 * el dueño llega aquí (SecurityConfig); la cuenta del dueño nunca se toca.
 */
@Service
public class WorkerService {

    public record Created(User worker, String temporaryPassword) {
    }

    private final UserRepository userRepository;
    private final WorkerPermissionRepository permissionRepository;
    private final PermissionService permissionService;
    private final PasswordEncoder passwordEncoder;
    private final TemporaryPasswordGenerator passwordGenerator;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    public WorkerService(UserRepository userRepository, WorkerPermissionRepository permissionRepository,
            PermissionService permissionService, PasswordEncoder passwordEncoder, TemporaryPasswordGenerator passwordGenerator,
            RefreshTokenService refreshTokenService, AuditService auditService) {
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
        this.permissionService = permissionService;
        this.passwordEncoder = passwordEncoder;
        this.passwordGenerator = passwordGenerator;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<User> list() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.WORKER)
                .sorted((a, b) -> a.getFirstName().compareToIgnoreCase(b.getFirstName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<Module, AccessLevel> permissionsOf(UUID workerId) {
        return permissionService.forUser(workerId).levels();
    }

    @Transactional
    public Created create(String email, String firstName, String lastName, Map<Module, AccessLevel> permissions, Actor actor) {
        validate(permissions);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException();
        }
        String password = passwordGenerator.next();
        String passwordHash = passwordEncoder.encode(password);
        User worker = new User(email, passwordHash, firstName, lastName, Role.WORKER);
        worker.setTemporaryPassword(passwordHash);
        worker = userRepository.save(worker);
        UUID id = worker.getId();
        permissions.forEach((module, level) -> permissionRepository.save(new WorkerPermission(id, module, level)));
        audit("WORKER_CREATED", worker, actor, describe(Map.of(), permissions));
        return new Created(worker, password);
    }

    @Transactional
    public User updatePermissions(UUID workerId, Map<Module, AccessLevel> permissions, Actor actor) {
        User worker = workerOrThrow(workerId);
        validate(permissions);
        Map<Module, AccessLevel> before = permissionService.forUser(workerId).levels();
        permissionRepository.deleteByUserId(workerId);
        permissionRepository.flush();
        permissions.forEach((module, level) -> permissionRepository.save(new WorkerPermission(workerId, module, level)));
        audit("WORKER_PERMISSIONS_CHANGED", worker, actor, describe(before, permissions));
        return worker;
    }

    @Transactional
    public String resetPassword(UUID workerId, Actor actor) {
        User worker = workerOrThrow(workerId);
        String password = passwordGenerator.next();
        worker.setTemporaryPassword(passwordEncoder.encode(password));
        userRepository.save(worker);
        refreshTokenService.revokeAll(workerId);
        audit("WORKER_PASSWORD_RESET", worker, actor, null);
        return password;
    }

    @Transactional
    public User setActive(UUID workerId, boolean active, Actor actor) {
        User worker = workerOrThrow(workerId);
        worker.setActive(active);
        userRepository.save(worker);
        if (!active) {
            refreshTokenService.revokeAll(workerId);
        }
        audit(active ? "WORKER_ACTIVATED" : "WORKER_DEACTIVATED", worker, actor, null);
        return worker;
    }

    /** Estadísticas del panel: cuentas por rol (dueño / trabajador). */
    @Transactional(readOnly = true)
    public Map<Role, Long> countByRole() {
        Map<Role, Long> counts = new EnumMap<>(Role.class);
        for (Role role : Role.values()) {
            counts.put(role, userRepository.countByRole(role));
        }
        return counts;
    }

    @Transactional(readOnly = true)
    public long countActive() {
        return userRepository.countByStatus(UserStatus.ACTIVE);
    }

    /** Quién hace la acción (para la auditoría). */
    public record Actor(UUID userId, String ipAddress) {
    }

    private User workerOrThrow(UUID workerId) {
        User user = userRepository.findById(workerId).orElseThrow(() -> new UserNotFoundException(workerId));
        if (user.getRole() == Role.OWNER) {
            throw new OwnerManagementDeniedException();
        }
        return user;
    }

    private static void validate(Map<Module, AccessLevel> permissions) {
        permissions.forEach((module, level) -> {
            boolean valid = module.isContent()
                    ? level == AccessLevel.CREATE || level == AccessLevel.PUBLISH
                    : level == AccessLevel.ACCESS;
            if (!valid) {
                throw new InvalidPermissionException(module, level);
            }
        });
    }

    /** "EVENTS: — → PUBLISH; ADVERTISING: ACCESS → —", en el orden de los módulos y solo lo que cambió. */
    static String describe(Map<Module, AccessLevel> before, Map<Module, AccessLevel> after) {
        Map<Module, AccessLevel> old = new EnumMap<>(Module.class);
        old.putAll(before);
        List<String> changes = new ArrayList<>();
        for (Module module : Module.values()) {
            AccessLevel from = old.get(module);
            AccessLevel to = after.get(module);
            if (from != to) {
                changes.add(module + ": " + (from == null ? "—" : from) + " → " + (to == null ? "—" : to));
            }
        }
        return changes.isEmpty() ? null : String.join("; ", changes);
    }

    private void audit(String action, User worker, Actor actor, String details) {
        String actorEmail = userRepository.findById(actor.userId()).map(User::getEmail).orElse(null);
        auditService.record(action, AuditResult.SUCCESS, actor.userId(), actorEmail, "worker", worker.getId().toString(),
                actor.ipAddress(), details);
    }
}
