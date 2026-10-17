package pe.plataformacontenidos.identity.permission;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Endpoint del panel que sirve a varios módulos: basta con tener acceso
 * (CREATE o más) a cualquiera de ellos. Ej.: las opciones de lugar las usan
 * Lugares, Eventos y Directorio. Lo evalúa ModuleAccessInterceptor.
 */
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresAnyModule {

    Module[] value();
}
