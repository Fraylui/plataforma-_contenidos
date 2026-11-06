-- Crédito de fotos y fuentes (2026-11, GUIA-CREAR-CONTENIDO.md §3–4).
--
-- 1) Cada foto puede llevar el nombre de su autor (credit). Si no es del
--    dueño, se exige confirmar que hay permiso por escrito o licencia libre
--    (rights_confirmed): D.Leg. 822 art. 39, citar no reemplaza el permiso.
--    Sin crédito = foto propia. Mismas columnas en todas las tablas que
--    guardan una ContentImage (embeddable compartido), incluida la de
--    campañas.
ALTER TABLE content.publication_images
    ADD COLUMN credit TEXT CHECK (credit IS NULL OR char_length(credit) <= 120),
    ADD COLUMN rights_confirmed BOOLEAN;
ALTER TABLE places.place_images
    ADD COLUMN credit TEXT CHECK (credit IS NULL OR char_length(credit) <= 120),
    ADD COLUMN rights_confirmed BOOLEAN;
ALTER TABLE celebrations.celebration_images
    ADD COLUMN credit TEXT CHECK (credit IS NULL OR char_length(credit) <= 120),
    ADD COLUMN rights_confirmed BOOLEAN;
ALTER TABLE galleries.gallery_images
    ADD COLUMN credit TEXT CHECK (credit IS NULL OR char_length(credit) <= 120),
    ADD COLUMN rights_confirmed BOOLEAN;
ALTER TABLE advertising.campaigns
    ADD COLUMN credit TEXT CHECK (credit IS NULL OR char_length(credit) <= 120),
    ADD COLUMN rights_confirmed BOOLEAN;

-- 2) Fuentes de un post (publicación, lugar, celebración): enlaces que se
--    muestran al final, «Fuentes: …» (D.Leg. 822 art. 44: autor y fuente,
--    sin formato académico). Hasta 10, uno por línea; se guardan con el post.
ALTER TABLE content.publications
    ADD COLUMN sources TEXT CHECK (sources IS NULL OR char_length(sources) <= 21000);
ALTER TABLE places.places
    ADD COLUMN sources TEXT CHECK (sources IS NULL OR char_length(sources) <= 21000);
ALTER TABLE celebrations.celebrations
    ADD COLUMN sources TEXT CHECK (sources IS NULL OR char_length(sources) <= 21000);
