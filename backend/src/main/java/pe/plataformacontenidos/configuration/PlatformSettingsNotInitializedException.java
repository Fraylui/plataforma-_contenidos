package pe.plataformacontenidos.configuration;

/** No debería ocurrir en un entorno migrado (V11 siembra la fila única) — indica una BD sin migrar. */
public class PlatformSettingsNotInitializedException extends RuntimeException {

    public PlatformSettingsNotInitializedException() {
        super("La configuración de plataforma no está inicializada");
    }
}
