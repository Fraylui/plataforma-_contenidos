package pe.plataformacontenidos.advertising;

/** El anuncio nativo no tiene la forma de un post del feed (texto, botón, un medio, destino web). */
public class InvalidCampaignFormatException extends RuntimeException {

    public InvalidCampaignFormatException(String message) {
        super(message);
    }
}
