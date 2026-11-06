package pe.plataformacontenidos.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

class R2StorageServiceTest {

    private static final String FILE = "3f2b6c1e-8a4d-4f1e-9b2a-7c6d5e4f3a2b.jpg";
    private final S3Client client = mock(S3Client.class);

    private R2StorageService service(String publicBaseUrl) {
        return new R2StorageService(client, new R2Properties("acc", "key", "secret", "imagenes", publicBaseUrl));
    }

    @Test
    void guardaEnElBucketConTipoYCacheDeUnAnio() {
        service(null).store(FILE, new byte[] {1, 2, 3});

        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(client).putObject(request.capture(), any(RequestBody.class));
        assertThat(request.getValue().bucket()).isEqualTo("imagenes");
        assertThat(request.getValue().key()).isEqualTo(FILE);
        assertThat(request.getValue().contentType()).isEqualTo("image/jpeg");
        assertThat(request.getValue().cacheControl()).isEqualTo(R2StorageService.CACHE_CONTROL);
    }

    @Test
    void borraDelBucket() {
        service(null).delete(FILE);

        ArgumentCaptor<DeleteObjectRequest> request = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(client).deleteObject(request.capture());
        assertThat(request.getValue().key()).isEqualTo(FILE);
    }

    @Test
    void conDominioPublicoDaLaDireccionDirecta() {
        assertThat(service("https://media.ejemplo.pe/").publicUrl(FILE)).contains("https://media.ejemplo.pe/" + FILE);
        assertThat(service(null).publicUrl(FILE)).isEmpty();
        assertThat(service("  ").publicUrl(FILE)).isEmpty();
    }

    @Test
    void rechazaNombresQueNoGeneraLaPlataforma() {
        R2StorageService service = service(null);
        assertThatThrownBy(() -> service.store("../secreto.jpg", new byte[0])).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.load("a/b.jpg")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.delete(null)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(client);
    }

    @Test
    void sinBucketNoArranca() {
        assertThatThrownBy(() -> new R2StorageService(client, new R2Properties("acc", "k", "s", " ", null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("app.media.r2.bucket");
    }

    @Test
    void tiposDeContenido() {
        assertThat(R2StorageService.contentTypeOf("x.png")).isEqualTo("image/png");
        assertThat(R2StorageService.contentTypeOf("x.jpg")).isEqualTo("image/jpeg");
    }
}
