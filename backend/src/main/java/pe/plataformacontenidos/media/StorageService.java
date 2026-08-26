package pe.plataformacontenidos.media;

/**
 * Abstracción de almacenamiento de binarios. Implementación local para el
 * MVP (CONTEXTO.md sección 10); una futura implementación S3-compatible
 * (Object Storage + CDN, sección 9) solo necesita otra clase que cumpla
 * esta interfaz — nada en ImageService cambia.
 */
public interface StorageService {

    void store(String storedFilename, byte[] content);

    byte[] load(String storedFilename);

    void delete(String storedFilename);
}
