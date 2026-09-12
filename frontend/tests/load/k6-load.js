// Test de carga: simula tráfico esperado en un día normal-alto para un
// sitio editorial solo-founder (CONTEXTO.md: meta AdSense, no un
// marketplace de alto tráfico). El objetivo es medir latencia y tasa de
// error bajo concurrencia realista, no romper el sistema (eso es
// k6-stress.js).
//
// Perfil: rampa a 20 usuarios virtuales concurrentes navegando contenido
// público (el 95% del tráfico real de un sitio de contenidos es lectura
// anónima), sostenido 2 minutos, luego baja.
//
// Uso: docker run --rm -i --network host -e BASE_URL=http://localhost:8080 \
//        grafana/k6 run - < k6-load.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const listingLatency = new Trend("listing_latency", true);
const detailLatency = new Trend("detail_latency", true);

export const options = {
  stages: [
    { duration: "20s", target: 20 }, // rampa
    { duration: "2m", target: 20 }, // sostenido: tráfico normal-alto
    { duration: "20s", target: 0 }, // baja
  ],
  thresholds: {
    // SLO razonable para un sitio de contenidos: p95 bajo 800ms, error <1%.
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
    listing_latency: ["p(95)<800"],
    detail_latency: ["p(95)<800"],
  },
};

const COLLECTIONS = ["articles", "places", "events", "galleries", "reviews", "directory"];

export default function () {
  // Patrón real de un lector: entra al listado, abre un ítem, a veces busca.
  const collection = COLLECTIONS[Math.floor(Math.random() * COLLECTIONS.length)];
  const listRes = http.get(`${BASE_URL}/api/v1/${collection}?size=20`, { tags: { name: "listing" } });
  listingLatency.add(listRes.timings.duration);
  check(listRes, { "listado: 200": (r) => r.status === 200 });

  const items = listRes.json("items");
  if (Array.isArray(items) && items.length > 0) {
    const item = items[Math.floor(Math.random() * items.length)];
    const detailRes = http.get(`${BASE_URL}/api/v1/${collection}/${item.slug}`, { tags: { name: "detail" } });
    detailLatency.add(detailRes.timings.duration);
    check(detailRes, { "detalle: 200": (r) => r.status === 200 });
  }

  if (Math.random() < 0.2) {
    http.get(`${BASE_URL}/api/v1/search?q=turismo`, { tags: { name: "search" } });
  }

  sleep(Math.random() * 2 + 1); // pausa de "lectura" entre 1-3s, evita tráfico artificialmente uniforme
}
