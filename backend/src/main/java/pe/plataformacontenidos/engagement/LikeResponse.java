package pe.plataformacontenidos.engagement;

public record LikeResponse(boolean liked, long likeCount) {

    public static LikeResponse from(ContentLikeService.LikeResult result) {
        return new LikeResponse(result.liked(), result.likeCount());
    }
}
