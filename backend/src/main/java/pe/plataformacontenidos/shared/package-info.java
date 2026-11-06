/**
 * Núcleo compartido (respuestas de error, paginación, flujo de publicación,
 * fotos y videos de contenido): módulo abierto, cualquier módulo puede usar
 * sus subpaquetes. No depende de ningún otro módulo.
 */
@ApplicationModule(type = ApplicationModule.Type.OPEN)
package pe.plataformacontenidos.shared;

import org.springframework.modulith.ApplicationModule;
