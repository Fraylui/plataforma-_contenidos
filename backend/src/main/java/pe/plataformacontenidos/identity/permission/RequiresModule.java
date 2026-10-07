package pe.plataformacontenidos.identity.permission;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Permiso que exige un endpoint del panel (spec 2a §4.1). En la clase vale
 * para todos sus métodos; en un método, lo reemplaza. Lo evalúa
 * ModuleAccessInterceptor en cada petición contra la base.
 */
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresModule {

    Module value();

    AccessLevel level() default AccessLevel.CREATE;
}
