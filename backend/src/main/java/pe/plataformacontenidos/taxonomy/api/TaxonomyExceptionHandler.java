package pe.plataformacontenidos.taxonomy.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.DuplicateCategoryNameException;
import pe.plataformacontenidos.taxonomy.InvalidCategoryHierarchyException;

@RestControllerAdvice
public class TaxonomyExceptionHandler {

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(CategoryNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidCategoryHierarchyException.class)
    public ResponseEntity<ProblemDetail> handleInvalidHierarchy(InvalidCategoryHierarchyException ex) {
        return Problems.of(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DuplicateCategoryNameException.class)
    public ResponseEntity<ProblemDetail> handleDuplicateName(DuplicateCategoryNameException ex) {
        return Problems.of(HttpStatus.CONFLICT, ex.getMessage());
    }
}
