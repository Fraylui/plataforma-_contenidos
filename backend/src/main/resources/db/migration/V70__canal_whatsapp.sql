-- Canal de WhatsApp del sitio (2026-10-16): «Síguenos en WhatsApp» al final
-- de cada publicación, el camino de regreso sin cuentas de lectores. Null =
-- no se muestra el botón.
ALTER TABLE configuration.platform_settings ADD COLUMN whatsapp_channel_url VARCHAR(255);
