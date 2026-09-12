// Test funcional de API (contrato + status codes) contra el backend real.
// Distinto de los tests de integración de Maven: éste corre contra un
// binario ya desplegado (Docker/staging/producción), sin Testcontainers,
// como lo haría un chequeo de salud post-deploy. 1 usuario virtual, sin
// carga — ver k6-load.js y k6-stress.js para el volumen.
//
// Uso: docker run --rm -i --network host grafana/k6 run - < k6-smoke.js
// (o `npm run test:api` que fija BASE_URL a localhost:8080)
import http from "k6/http";
import { check, group, fail } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  vus: 1,
  iterations: 1,
  // No se usa el threshold http_req_failed: k6 marca como "fallidas" las
  // respuestas no-2xx/3xx por defecto, pero este smoke verifica a propósito
  // 401/403/404 esperados (contrato de seguridad). El contrato real de
  // éxito son los `checks` explícitos de abajo.
  thresholds: {
    checks: ["rate==1"],
  },
};

export default function () {
  group("salud del servicio", () => {
    const res = http.get(`${BASE_URL}/actuator/health`);
    check(res, {
      "health responde 200": (r) => r.status === 200,
      "health reporta UP": (r) => r.json("status") === "UP",
    });
  });

  group("listados públicos devuelven 200 y forma esperada", () => {
    for (const collection of ["articles", "places", "events", "galleries", "reviews", "directory"]) {
      const res = http.get(`${BASE_URL}/api/v1/${collection}?size=5`);
      check(res, {
        [`${collection}: status 200`]: (r) => r.status === 200,
        [`${collection}: tiene items[]`]: (r) => Array.isArray(r.json("items")),
        [`${collection}: tiene totalElements`]: (r) => typeof r.json("totalElements") === "number",
      });
    }
  });

  group("categorías y geografía públicas responden", () => {
    check(http.get(`${BASE_URL}/api/v1/categories`), { "categories: 200": (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/v1/geography`), { "geography: 200": (r) => r.status === 200 });
  });

  group("autenticación: credenciales inválidas -> 401, endpoints admin sin token -> 403", () => {
    const login = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: "no-existe@plataforma-contenidos.test", password: "incorrecta" }),
      { headers: { "Content-Type": "application/json" } },
    );
    check(login, { "login inválido -> 401": (r) => r.status === 401 });

    const adminUsers = http.get(`${BASE_URL}/api/v1/admin/users`);
    check(adminUsers, { "admin/users sin token -> 403": (r) => r.status === 403 });
  });

  group("búsqueda pública responde", () => {
    const res = http.get(`${BASE_URL}/api/v1/search?q=a`);
    check(res, { "search: 200": (r) => r.status === 200 });
  });

  group("errores no filtran detalles internos", () => {
    const res = http.get(`${BASE_URL}/api/v1/articles/slug-inexistente-xyz`);
    check(res, {
      "artículo inexistente -> 404": (r) => r.status === 404,
      "sin stack trace en el cuerpo": (r) => !String(r.body).includes("at pe.plataformacontenidos"),
    });
  });
}

export function handleSummary(data) {
  if (data.metrics.checks.values.rate < 1) {
    fail("Algún chequeo de contrato de API falló — ver detalle arriba.");
  }
  return { stdout: "\n✔ Smoke de API: todos los contratos verificados.\n" };
}
