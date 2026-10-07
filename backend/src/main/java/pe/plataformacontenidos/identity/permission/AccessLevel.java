package pe.plataformacontenidos.identity.permission;

/**
 * CREATE: crea y edita lo propio en borrador y lo envía a revisión.
 * PUBLISH: además aprueba, publica, programa y archiva lo de todos (implica CREATE).
 * ACCESS: acceso a un módulo que no es de contenido (temas, estadísticas, publicidad).
 */
public enum AccessLevel {
    CREATE,
    PUBLISH,
    ACCESS
}
