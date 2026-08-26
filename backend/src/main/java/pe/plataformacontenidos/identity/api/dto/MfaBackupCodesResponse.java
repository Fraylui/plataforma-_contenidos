package pe.plataformacontenidos.identity.api.dto;

import java.util.List;

/** Los códigos van en texto plano solo en esta respuesta: no se pueden volver a mostrar después (se guardan hasheados). */
public record MfaBackupCodesResponse(List<String> backupCodes) {
}
