package pe.plataformacontenidos.advertising;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.advertising.CampaignService.CampaignDraft;
import pe.plataformacontenidos.media.Image;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/** Reglas de una campaña antes de guardarla, sin base de datos. */
class CampaignDraftValidatorTest {

    private static final String BANNER_KEY = "lateral";

    private final AdPlacementRepository placements = mock(AdPlacementRepository.class);
    private final ImageService images = mock(ImageService.class);
    private final CategoryService categories = mock(CategoryService.class);
    private final CampaignDraftValidator validator = new CampaignDraftValidator(placements, images, categories);

    private final UUID imageId = UUID.randomUUID();

    private CampaignDraft banner(String linkUrl, CampaignTargeting targeting) {
        return new CampaignDraft(BANNER_KEY, CampaignFormat.BANNER, new ContentImageInput(imageId, null, null, null),
                null, linkUrl, null, null, null, null, null, targeting, true);
    }

    private void placement(int width, int height) {
        AdPlacement placement = mock(AdPlacement.class);
        when(placement.getWidth()).thenReturn(width);
        when(placement.getHeight()).thenReturn(height);
        when(placements.findByKey(BANNER_KEY)).thenReturn(Optional.of(placement));
    }

    private void image(int width, int height) {
        Image image = mock(Image.class);
        when(image.getWidth()).thenReturn(width);
        when(image.getHeight()).thenReturn(height);
        when(images.getOrThrow(imageId)).thenReturn(image);
    }

    @Test
    void aBannerThatFitsItsPlacementIsAccepted() {
        placement(300, 250);
        image(600, 500);

        var valid = validator.validate(banner("https://polleriaelinca.pe", CampaignTargeting.EVERYWHERE));

        assertThat(valid.placementKey()).isEqualTo(BANNER_KEY);
        assertThat(valid.nativeAd()).isNull();
    }

    @Test
    void theClickDestinationMustBeAWebPage() {
        placement(300, 250);
        image(600, 500);

        assertThatThrownBy(() -> validator.validate(banner("javascript:alert(1)", CampaignTargeting.EVERYWHERE)))
                .isInstanceOf(InvalidCampaignFormatException.class);
        assertThatThrownBy(() -> validator.validate(banner("ftp://archivos.pe", CampaignTargeting.EVERYWHERE)))
                .isInstanceOf(InvalidCampaignFormatException.class);
    }

    @Test
    void aBannerWithTheWrongProportionOrTooSmallIsRejected() {
        placement(300, 250);
        image(600, 300);
        assertThatThrownBy(() -> validator.validate(banner("https://a.pe", CampaignTargeting.EVERYWHERE)))
                .isInstanceOf(InvalidCampaignImageException.class);

        image(150, 125);
        assertThatThrownBy(() -> validator.validate(banner("https://a.pe", CampaignTargeting.EVERYWHERE)))
                .isInstanceOf(InvalidCampaignImageException.class);
    }

    @Test
    void targetingATopicThatNoLongerExistsIsRejected() {
        UUID gone = UUID.randomUUID();
        when(categories.getOrThrow(gone)).thenThrow(new CategoryNotFoundException(gone));

        assertThatThrownBy(() -> validator.validate(banner("https://a.pe",
                new CampaignTargeting(Set.of(), Set.of(gone), Set.of(), Set.of()))))
                .isInstanceOf(InvalidCampaignTargetingException.class);
    }
}
