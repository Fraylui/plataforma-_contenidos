// Test de estrés: lleva la concurrencia mucho más allá del tráfico
// esperado para encontrar el punto de quiebre (cuándo empieza a degradar o
// a devolver errores) y confirmar que degrada con gracia (más lento, no
// caído ni con 500). Referencia para decidir cuándo escalar el backend o
// añadir caché/CDN delante de la API pública.
//
// Uso: docker run --rm -i --network host -e BASE_URL=http://localhost:8080 \
//        grafana/k6 run - < k6-stress.js
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 150 },
    { duration: "1m", target: 300 }, // muy por encima del tráfico esperado de un sitio solo-founder
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // Bajo estrés se tolera latencia alta, pero NUNCA un 5xx: eso sería un
    // fallo real (agotamiento de pool de conexiones, OOM, etc.), no solo
    // "lento". Este es el umbral que de verdad importa acá.
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/articles?size=20`);
  check(res, {
    "nunca 5xx": (r) => r.status < 500,
  });
  sleep(0.3);
}
