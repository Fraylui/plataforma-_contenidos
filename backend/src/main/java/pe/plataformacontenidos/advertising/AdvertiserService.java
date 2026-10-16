package pe.plataformacontenidos.advertising;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.media.ImageNotFoundException;
import pe.plataformacontenidos.media.ImageService;

@Service
@Transactional
public class AdvertiserService {

    private final AdvertiserRepository advertiserRepository;
    private final CampaignRepository campaignRepository;
    private final ImageService imageService;

    public AdvertiserService(AdvertiserRepository advertiserRepository, CampaignRepository campaignRepository,
            ImageService imageService) {
        this.advertiserRepository = advertiserRepository;
        this.campaignRepository = campaignRepository;
        this.imageService = imageService;
    }

    public Advertiser create(String name, String contactEmail, String contactPhone, UUID logoImageId) {
        requireLogo(logoImageId);
        return advertiserRepository.save(new Advertiser(name, contactEmail, contactPhone, logoImageId));
    }

    public Advertiser update(UUID id, String name, String contactEmail, String contactPhone, UUID logoImageId) {
        Advertiser advertiser = getOrThrow(id);
        requireLogo(logoImageId);
        advertiser.update(name, contactEmail, contactPhone, logoImageId);
        return advertiserRepository.save(advertiser);
    }

    private void requireLogo(UUID logoImageId) {
        if (logoImageId == null) {
            return;
        }
        try {
            imageService.getOrThrow(logoImageId);
        } catch (ImageNotFoundException e) {
            throw new InvalidAdvertiserLogoException();
        }
    }

    /** Bloquea el borrado si tiene campañas (ver AdvertiserHasCampaignsException) — evita huérfanas. */
    public void delete(UUID id) {
        getOrThrow(id);
        if (campaignRepository.existsByAdvertiserId(id)) {
            throw new AdvertiserHasCampaignsException(id);
        }
        advertiserRepository.deleteById(id);
    }

    public List<Advertiser> listAll() {
        return advertiserRepository.findAll();
    }

    public Advertiser getOrThrow(UUID id) {
        return advertiserRepository.findById(id).orElseThrow(() -> new AdvertiserNotFoundException(id));
    }
}
