package pe.plataformacontenidos.media;

import java.util.Optional;

/**
 * Abstracción de almacenamiento de binarios (patrón Strategy): disco local
 * (LocalFilesystemStorageService, por defecto) o Cloudflare R2
 * (R2StorageService, {@code app.media.storage=r2}). ImageService no sabe
 * cuál se usa.
 */
public interface StorageService {

    void store(String storedFilename, byte[] content);

    byte[] load(String storedFilename);

    void delete(String storedFilename);

    /**
     * Dirección pública desde la que el navegador puede bajar el archivo sin
     * pasar por el backend (p. ej. el dominio del bucket de R2). Vacío = lo
     * sirve el backend.
     */
    default Optional<String> publicUrl(String storedFilename) {
        return Optional.empty();
    }
}
