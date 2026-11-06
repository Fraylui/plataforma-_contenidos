import { describe, expect, it } from "vitest";
import { nativePhotoFit, videoAspect, youtubeVideoId } from "./native-media";

describe("youtubeVideoId", () => {
  it("reconoce los links de YouTube que acepta el servidor", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ?si=x")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rechaza lo que no es un video de YouTube", () => {
    expect(youtubeVideoId("https://vimeo.com/123")).toBeNull();
    expect(youtubeVideoId("")).toBeNull();
  });

  it("un Short es vertical", () => {
    expect(videoAspect("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("9:16");
    expect(videoAspect("https://youtu.be/dQw4w9WgXcQ")).toBe("16:9");
  });
});

describe("nativePhotoFit", () => {
  it("acepta cuadrada, vertical 4:5 y horizontal 1.91:1", () => {
    expect(nativePhotoFit(1080, 1080)).toEqual({ ok: true, aspect: "1:1" });
    expect(nativePhotoFit(1080, 1350)).toEqual({ ok: true, aspect: "4:5" });
    expect(nativePhotoFit(1200, 628)).toEqual({ ok: true, aspect: "1.91:1" });
  });

  it("rechaza un banner y una foto chica", () => {
    expect(nativePhotoFit(600, 500)).toEqual({ ok: false, reason: "aspect" });
    expect(nativePhotoFit(400, 400)).toEqual({ ok: false, reason: "small" });
  });
});
