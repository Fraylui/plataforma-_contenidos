-- Posiciones de anuncio que el frontend usa por su key (AdBlock position=...,
-- AnchorAdSlot, feed del home) pero que hasta ahora solo existían si alguien
-- las creaba a mano en Configuración → Publicidad: en una base nueva (la de
-- producción) esos espacios no mostraban nunca nada, ni AdSense ni campañas
-- directas. 'article' y 'listing' ya las crea V37.
-- ON CONFLICT: donde ya se crearon a mano se respetan tal cual (etiqueta,
-- slot de AdSense, activada o no).
INSERT INTO advertising.ad_placements (key, label)
VALUES ('cabecera', 'Cabecera de listado'),
       ('en-feed', 'Dentro del feed'),
       ('anchor', 'Flotante inferior (con X)')
ON CONFLICT (key) DO NOTHING;
