-- El editor de "Contenido" de Publicaciones pasa de textarea de texto
-- plano a Tiptap (rich text -> HTML). El público renderizaba body con
-- white-space:pre-line (los saltos de línea los hacía el CSS); si ahora
-- se renderiza como HTML crudo, los saltos de línea existentes colapsan
-- a menos que se conviertan a párrafos reales antes del cambio.
CREATE OR REPLACE FUNCTION content.plain_text_to_html(input text)
RETURNS text AS $$
DECLARE
    escaped text;
    paragraphs text[];
    result text := '';
    para text;
BEGIN
    -- Escapar HTML literal que ya hubiera en el texto plano (ej. alguien
    -- escribió "<3" en un artículo) -- no queremos crear tags sin querer.
    escaped := replace(replace(replace(input, '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
    -- Párrafos separados por una o más líneas en blanco.
    paragraphs := regexp_split_to_array(escaped, E'\\n\\s*\\n');
    FOREACH para IN ARRAY paragraphs LOOP
        para := btrim(para, E' \t\r\n');
        IF para <> '' THEN
            result := result || '<p>' || replace(para, E'\n', '<br>') || '</p>';
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE content.articles SET body = content.plain_text_to_html(body);

DROP FUNCTION content.plain_text_to_html(text);
