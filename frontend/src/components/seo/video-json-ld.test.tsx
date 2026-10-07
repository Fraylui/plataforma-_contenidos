import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VideoJsonLd } from "./video-json-ld";

function jsonLdOf(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return script ? JSON.parse(script.innerHTML) : null;
}

describe("VideoJsonLd", () => {
  it("marca un video de YouTube con miniatura y embed sin cookies", () => {
    const { container } = render(
      <VideoJsonLd
        videos={[{ videoId: "abc123XYZ00", title: "Recorrido", caption: null }]}
        fallbackTitle="Publicación"
        description="Descripción"
        uploadDate="2026-09-01T10:00:00Z"
      />,
    );
    const data = jsonLdOf(container);
    expect(data["@type"]).toBe("VideoObject");
    expect(data.name).toBe("Recorrido");
    expect(data.thumbnailUrl).toEqual(["https://i.ytimg.com/vi/abc123XYZ00/hqdefault.jpg"]);
    expect(data.embedUrl).toBe("https://www.youtube-nocookie.com/embed/abc123XYZ00");
    expect(data.uploadDate).toBe("2026-09-01T10:00:00Z");
  });

  // CodeQL (2026-10-07): el escape usaba "<" en una cadena JS, que ES "<":
  // no escapaba nada y un título con </script> salía del bloque (XSS guardado).
  it("un título con </script> no puede cerrar el bloque ni inyectar HTML", () => {
    const { container } = render(
      <VideoJsonLd
        videos={[{ videoId: "abc123XYZ00", title: "</script><img src=x onerror=alert(1)>", caption: null }]}
        fallbackTitle="Publicación"
        description={null}
        uploadDate="2026-09-01T10:00:00Z"
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]')!;
    expect(script.innerHTML).not.toContain("<");
    expect(container.querySelector("img")).toBeNull();
    expect(jsonLdOf(container).name).toBe("</script><img src=x onerror=alert(1)>");
  });

  it("no renderiza nada sin videos o sin fecha de publicación", () => {
    const { container: noVideos } = render(
      <VideoJsonLd videos={[]} fallbackTitle="X" description={null} uploadDate="2026-09-01T10:00:00Z" />,
    );
    const { container: noDate } = render(
      <VideoJsonLd videos={[{ videoId: "abc123XYZ00", title: null, caption: null }]} fallbackTitle="X" description={null} uploadDate={null} />,
    );
    expect(jsonLdOf(noVideos)).toBeNull();
    expect(jsonLdOf(noDate)).toBeNull();
  });
});
