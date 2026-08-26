package pe.plataformacontenidos.media;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;

@Service
@EnableConfigurationProperties(MediaProperties.class)
public class LocalFilesystemStorageService implements StorageService {

    private final Path baseDir;

    public LocalFilesystemStorageService(MediaProperties properties) {
        this.baseDir = Path.of(properties.localStoragePath()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(baseDir);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo crear el directorio de almacenamiento de medios", e);
        }
    }

    @Override
    public void store(String storedFilename, byte[] content) {
        try {
            Files.write(resolve(storedFilename), content);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el archivo " + storedFilename, e);
        }
    }

    @Override
    public byte[] load(String storedFilename) {
        try {
            return Files.readAllBytes(resolve(storedFilename));
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo " + storedFilename, e);
        }
    }

    @Override
    public void delete(String storedFilename) {
        try {
            Files.deleteIfExists(resolve(storedFilename));
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo borrar el archivo " + storedFilename, e);
        }
    }

    /**
     * storedFilename siempre lo genera ImageProcessor (UUID + extensión
     * fija), nunca viene del usuario — pero se revalida igual como defensa
     * en profundidad contra path traversal.
     */
    private Path resolve(String storedFilename) {
        Path resolved = baseDir.resolve(storedFilename).normalize();
        if (!resolved.startsWith(baseDir)) {
            throw new IllegalArgumentException("Nombre de archivo inválido: " + storedFilename);
        }
        return resolved;
    }
}
