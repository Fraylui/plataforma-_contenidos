-- La descripción inicial («Sistema de gestión y distribución de contenidos
-- digitales») hablaba como un software de oficina y es lo que ve la gente en
-- Google y al compartir el sitio. Solo se cambia si nadie la editó en
-- Configuración.
UPDATE configuration.platform_settings
   SET description = 'Lugares, celebraciones, fotos y cosas que vale la pena conocer del Perú.'
 WHERE description = 'Sistema de gestión y distribución de contenidos digitales.';
