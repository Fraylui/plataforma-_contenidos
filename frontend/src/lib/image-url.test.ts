import { afterEach, describe, expect, it } from "vitest";
import { imageUrl } from "./image-url";

const ORIGINAL = process.env.NEXT_PUBLIC_BACKEND_ASSET_URL;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.NEXT_PUBLIC_BACKEND_ASSET_URL;
  } else {
    process.env.NEXT_PUBLIC_BACKEND_ASSET_URL = ORIGINAL;
  }
});

describe("imageUrl", () => {
  it("usa http://localhost:8080 por defecto si la env var no está definida", () => {
    delete process.env.NEXT_PUBLIC_BACKEND_ASSET_URL;
    expect(imageUrl("/api/v1/images/abc/file")).toBe("http://localhost:8080/api/v1/images/abc/file");
  });

  it("usa NEXT_PUBLIC_BACKEND_ASSET_URL cuando está definida", () => {
    process.env.NEXT_PUBLIC_BACKEND_ASSET_URL = "https://cdn.ejemplo.test";
    expect(imageUrl("/api/v1/images/abc/file")).toBe("https://cdn.ejemplo.test/api/v1/images/abc/file");
  });
});
