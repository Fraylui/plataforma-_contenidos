package pe.plataformacontenidos.advertising.api.dto;

import java.util.UUID;
import pe.plataformacontenidos.advertising.Advertiser;
import pe.plataformacontenidos.advertising.AdvertiserIndustry;

public record AdvertiserResponse(UUID id, String name, String contactEmail, String contactPhone, UUID logoImageId,
        AdvertiserIndustry industry) {

    public static AdvertiserResponse from(Advertiser advertiser) {
        return new AdvertiserResponse(advertiser.getId(), advertiser.getName(), advertiser.getContactEmail(),
                advertiser.getContactPhone(), advertiser.getLogoImageId(), advertiser.getIndustry());
    }
}
