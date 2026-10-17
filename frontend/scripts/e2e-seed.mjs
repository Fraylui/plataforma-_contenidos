// Contenido mínimo para las pruebas de punta a punta y Lighthouse en CI:
// un tema y un contenido publicado de cada tipo, con una foto generada acá
// (sin depender de internet). Corre contra una base vacía, como el dueño
// que crea IdentityBootstrap (BOOTSTRAP_ADMIN_EMAIL / _PASSWORD).
// Uso: E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… node scripts/e2e-seed.mjs
// Escribe en GITHUB_ENV la URL de una celebración para Lighthouse.
import { appendFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const API = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const SITE = process.env.SITE_URL ?? "http://localhost:3000";

async function call(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

/**
 * PNG con degradado y textura (800 × 600). No de un solo color: Chrome
 * descarta las imágenes de muy poca información para el LCP, y así
 * Lighthouse mediría el texto en vez de la foto, distinto de producción.
 */
function png(width, height, [r, g, b]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(typeAndData));
    return Buffer.concat([len, typeAndData, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits por canal
  header[9] = 2; // RGB
  let seed = 7;
  const noise = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 48) - 24;
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const rows = Array.from({ length: height }, (_, y) => {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      const shade = (x / width) * 90 - (y / height) * 60;
      row[1 + x * 3] = clamp(r + shade + noise());
      row[2 + x * 3] = clamp(g - shade / 2 + noise());
      row[3 + x * 3] = clamp(b + shade / 3 + noise());
    }
    return row;
  });
  const pixels = deflateSync(Buffer.concat(rows));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", pixels),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const { accessToken: token } = await call("POST", "/api/v1/auth/login", null, {
  email: process.env.E2E_ADMIN_EMAIL,
  password: process.env.E2E_ADMIN_PASSWORD,
});

const category = await call("POST", "/api/v1/admin/categories", token, { name: "Cultura", description: "Tradiciones y arte." });

const form = new FormData();
form.append("file", new Blob([png(800, 600, [11, 218, 81])], { type: "image/png" }), "portada.png");
const image = await call("POST", "/api/v1/admin/images?altText=Portada%20de%20prueba", token, form);
const images = [{ imageId: image.id, externalUrl: null, title: null, caption: "Foto de prueba" }];
const body = "<p>Contenido de prueba para las pruebas automáticas del sitio.</p>";
const common = { categoryId: category.id, images, videos: [], robots: "index,follow" };

async function publish(adminPath, input) {
  const created = await call("POST", `/api/v1/admin/${adminPath}`, token, input);
  await call("POST", `/api/v1/admin/${adminPath}/${created.id}/publish`, token);
  console.log(`publicado: ${adminPath}/${created.slug}`);
  return created;
}

await publish("publications", { ...common, title: "Textiles de Huamanga", excerpt: "Arte que se teje.", body, publicationType: "GENERAL" });
await publish("places", { ...common, name: "Mirador de Acuchimay", excerpt: "La ciudad desde arriba.", body, latitude: -13.17, longitude: -74.22 });
await publish("galleries", { ...common, title: "Paisajes de prueba", excerpt: "Una galería." });
await publish("directory", { ...common, name: "Taller de retablos", excerpt: "Artesanía.", body, businessType: "SHOP", phone: "999888777" });
const today = new Date().toISOString().slice(0, 10);
const celebration = await publish("celebrations", {
  ...common,
  title: "Día de prueba",
  excerpt: "Una fecha que se repite.",
  body,
  startsAt: `${today}T05:00:00Z`,
  recursYearly: true,
  allDay: true,
});

if (process.env.GITHUB_ENV) {
  appendFileSync(process.env.GITHUB_ENV, `LHCI_DETAIL_URL=${SITE}/celebraciones/${celebration.slug}\n`);
}
