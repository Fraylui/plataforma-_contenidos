package pe.plataformacontenidos.directory.api;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.directory.BusinessService;
import pe.plataformacontenidos.directory.BusinessType;
import pe.plataformacontenidos.directory.api.dto.BusinessResponse;
import pe.plataformacontenidos.directory.api.dto.BusinessSummaryResponse;
import pe.plataformacontenidos.directory.api.dto.PageResponse;

/** Solo contenido PUBLISHED — nada de estados intermedios visibles públicamente. */
@RestController
@RequestMapping("/api/v1/directory")
public class BusinessPublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final BusinessService businessService;

    public BusinessPublicController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @GetMapping
    public PageResponse<BusinessSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID geographyId,
            @RequestParam(required = false) BusinessType businessType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(size, MAX_PAGE_SIZE);
        var pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = businessService.listPublished(categoryId, geographyId, businessType, pageable);
        return PageResponse.from(result, BusinessSummaryResponse::from);
    }

    @GetMapping("/{slug}")
    public BusinessResponse getBySlug(@PathVariable String slug) {
        Business business = businessService.getPublishedBySlug(slug);
        return BusinessResponse.from(business);
    }
}
