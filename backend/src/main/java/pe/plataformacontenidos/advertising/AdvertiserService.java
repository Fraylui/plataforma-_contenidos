package pe.plataformacontenidos.advertising;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdvertiserService {

    private final AdvertiserRepository advertiserRepository;
    private final CampaignRepository campaignRepository;

    public AdvertiserService(AdvertiserRepository advertiserRepository, CampaignRepository campaignRepository) {
        this.advertiserRepository = advertiserRepository;
        this.campaignRepository = campaignRepository;
    }

    public Advertiser create(String name, String contactEmail, String contactPhone) {
        return advertiserRepository.save(new Advertiser(name, contactEmail, contactPhone));
    }

    public Advertiser update(UUID id, String name, String contactEmail, String contactPhone) {
        Advertiser advertiser = getOrThrow(id);
        advertiser.update(name, contactEmail, contactPhone);
        return advertiserRepository.save(advertiser);
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
