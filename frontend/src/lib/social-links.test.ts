import { describe, expect, it } from "vitest";
import { officialSocialLinks, socialLinkError } from "./social-links";

const none = { youtubeUrl: null, instagramUrl: null, tiktokUrl: null, facebookUrl: null, xUrl: null, whatsappChannelUrl: null };

describe("officialSocialLinks", () => {
  it("solo las redes puestas, en el orden de la plataforma", () => {
    const links = officialSocialLinks({ ...none, xUrl: "https://x.com/ecos", youtubeUrl: "https://youtube.com/@ecos" });
    expect(links.map((link) => link.key)).toEqual(["youtube", "x"]);
    expect(links[0]).toMatchObject({ label: "YouTube", url: "https://youtube.com/@ecos" });
  });

  it("sin redes, nada", () => {
    expect(officialSocialLinks(none)).toEqual([]);
  });
});

describe("socialLinkError (mismas reglas que el backend)", () => {
  it("acepta el enlace de su red y vacío", () => {
    expect(socialLinkError("instagram", "https://instagram.com/ecos")).toBeNull();
    expect(socialLinkError("tiktok", "")).toBeNull();
  });

  it("rechaza el enlace de otra red o sin https, con un mensaje que dice qué pegar", () => {
    expect(socialLinkError("youtube", "https://instagram.com/ecos")).toMatch(/YouTube/);
    expect(socialLinkError("x", "x.com/ecos")).toMatch(/https:\/\/x\.com/);
  });
});
