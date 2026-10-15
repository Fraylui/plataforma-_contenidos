package pe.plataformacontenidos.identity.permission;

/**
 * PUBLISH: crea, edita, publica, programa y archiva el contenido del módulo
 * (sin paso de aprobación, decisión del dueño 2026-10-15).
 * ACCESS: acceso a un módulo que no es de contenido (temas, estadísticas, publicidad).
 */
public enum AccessLevel {
    PUBLISH,
    ACCESS
}
