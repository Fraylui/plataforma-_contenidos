// Simulación de uso real: muchas personas navegando el sitio a la vez, como
// lo harían en un celular — entran al inicio, bajan por el feed, abren un
// post, dan "me gusta", buscan, ven anuncios — contra el sitio que ve el
// visitante (Next, que a su vez llama al backend), no solo contra la API.
//
// Perfiles (variable PERFIL):
//   humo    — 5 personas, 30 s: valida el script
//   normal  — 50 personas a la vez, 3 minutos (un día bueno)
//   pico    — sube a 200 (una publicación que se hace viral)
//   quiebre — sube hasta 600 para encontrar dónde empieza a degradar
//
// Los "me gusta" se dan y se quitan (neto cero) y las impresiones de
// anuncios sí se registran: correr con scripts de respaldo de métricas
// (ver CONTEXTO §46.6g) para no ensuciar los reportes reales.
//
// Uso:
//   docker run --rm -i --network host -e PERFIL=normal \
//     -e WEB_URL=http://localhost:3000 -e API_URL=http://localhost:8080 \
//     grafana/k6 run - < k6-simulacion.js
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

const WEB = __ENV.WEB_URL || "http://localhost:3000";
const API = __ENV.API_URL || "http://localhost:8080";
const PERFIL = __ENV.PERFIL || "normal";

const STAGES = {
  humo: [{ duration: "30s", target: 5 }],
  normal: [
    { duration: "30s", target: 50 },
    { duration: "3m", target: 50 },
    { duration: "20s", target: 0 },
  ],
  pico: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 200 },
    { duration: "2m", target: 200 },
    { duration: "30s", target: 0 },
  ],
  quiebre: [
    { duration: "1m", target: 150 },
    { duration: "1m", target: 300 },
    { duration: "1m", target: 450 },
    { duration: "1m", target: 600 },
    { duration: "30s", target: 0 },
  ],
};

export const options = {
  scenarios: {
    lectores: { executor: "ramping-vus", stages: STAGES[PERFIL], gracefulRampDown: "20s" },
  },
  thresholds: {
    // Un 5xx es un fallo real (pool agotado, error no controlado); la lentitud se mide aparte.
    errores_servidor: ["count<1"],
    http_req_failed: ["rate<0.01"],
    pagina_ssr: ["p(95)<1500"],
    api_navegador: ["p(95)<500"],
    // Desglose por tipo de petición (aparecen en el resumen para ubicar cuellos de botella).
    "pagina_ssr{name:inicio}": ["p(95)<1500"],
    "pagina_ssr{name:detalle}": ["p(95)<1500"],
    "pagina_ssr{name:seccion}": ["p(95)<1500"],
    "pagina_ssr{name:buscar}": ["p(95)<1500"],
    "api_navegador{name:feed}": ["p(95)<500"],
    "api_navegador{name:anuncio}": ["p(95)<500"],
    "api_navegador{name:impresion}": ["p(95)<500"],
    "api_navegador{name:me_gusta}": ["p(95)<500"],
    "api_navegador{name:sugerencias}": ["p(95)<500"],
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

const paginaSsr = new Trend("pagina_ssr", true);
const apiNavegador = new Trend("api_navegador", true);
const erroresServidor = new Counter("errores_servidor");

// El feed del sitio (/api/feed) devuelve `kind` y `href` ya resueltos, no el `type` del backend.
const LIKE_TYPE = { publicacion: "articles", lugar: "places", evento: "events", galeria: "galleries", directorio: "directory" };
const SEARCHES = ["lima", "cusco", "playa", "museo", "comida", "hotel", "festival", "ruta"];
const USER_AGENTS = [
  "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0",
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Cada usuario virtual es una persona distinta: su IP (la que pondría nginx), su navegador y su visitorId.
const persona = {};
function headers() {
  if (!persona.ip) {
    persona.ip = `10.${__VU % 250}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
    persona.ua = pick(USER_AGENTS);
    persona.visitorId = uuid();
  }
  return { "X-Real-IP": persona.ip, "X-Forwarded-For": persona.ip, "User-Agent": persona.ua, "Accept-Language": "es-PE,es;q=0.9" };
}

function track(res, trend, name) {
  trend.add(res.timings.duration, { name });
  if (res.status >= 500) erroresServidor.add(1, { name, status: String(res.status) });
  check(res, { [`${name}: sin error de servidor`]: (r) => r.status < 500 });
}

function page(path, name) {
  const res = http.get(`${WEB}${path}`, { headers: headers(), tags: { name } });
  track(res, paginaSsr, name);
  check(res, { [`${name}: 200`]: (r) => r.status === 200 });
  return res;
}

function browserApi(method, path, name) {
  const res = method === "POST"
    ? http.post(`${WEB}${path}`, null, { headers: headers(), tags: { name } })
    : http.get(`${WEB}${path}`, { headers: headers(), tags: { name } });
  track(res, apiNavegador, name);
  return res;
}

function showAd(placement) {
  const res = browserApi("GET", `/api/ads/campaign?placement=${placement}`, "anuncio");
  if (res.status === 200 && res.body) {
    const id = res.json("id");
    if (id) browserApi("POST", `/api/ads/impression?id=${id}`, "impresion");
  }
}

export default function () {
  let feed = [];
  const seed = uuid().slice(0, 8);

  group("inicio y feed", () => {
    page("/", "inicio");
    const first = browserApi("GET", `/api/feed?size=12&seed=${seed}`, "feed");
    if (first.status === 200) feed = first.json("items") || [];
    // Baja por el feed: dos páginas más, como el scroll infinito.
    for (let i = 0; i < 2 && feed.length > 0; i++) {
      sleep(Math.random() * 2 + 1);
      const exclude = feed.map((item) => `exclude=${item.id}`).join("&");
      const next = browserApi("GET", `/api/feed?size=12&seed=${seed}&${exclude}`, "feed");
      if (next.status === 200) feed = feed.concat(next.json("items") || []);
      if (Math.random() < 0.5) showAd("en-feed");
    }
  });

  if (feed.length > 0) {
    group("abre un post", () => {
      const item = pick(feed);
      sleep(Math.random() * 2 + 0.5);
      page(item.href, "detalle");
      showAd("article");

      const roll = Math.random();
      if (roll < 0.12) {
        // "Me gusta" y lo quita (neto cero para no inflar los contadores reales).
        const path = `/api/content/${LIKE_TYPE[item.kind]}/${item.slug}/like?visitorId=${persona.visitorId}`;
        browserApi("POST", path, "me_gusta");
        sleep(0.3);
        browserApi("POST", path, "me_gusta");
      } else if (roll < 0.14) {
        // Doble toque rápido: dos "me gusta" simultáneos de la misma persona (condición de carrera).
        const path = `${WEB}/api/content/${LIKE_TYPE[item.kind]}/${item.slug}/like?visitorId=${persona.visitorId}`;
        const params = { headers: headers(), tags: { name: "me_gusta_doble" } };
        const responses = http.batch([["POST", path, null, params], ["POST", path, null, params]]);
        responses.forEach((res) => track(res, apiNavegador, "me_gusta_doble"));
        // Deja el contador como estaba: si quedó en "me gusta", lo quita.
        const last = responses[1].status === 200 ? responses[1].json("liked") : false;
        const first = responses[0].status === 200 ? responses[0].json("liked") : false;
        if (first && last) browserApi("POST", path.replace(WEB, ""), "me_gusta");
      }
    });
  }

  const roll = Math.random();
  if (roll < 0.2) {
    group("busca", () => {
      const q = pick(SEARCHES);
      for (let i = 2; i <= q.length; i += 2) browserApi("GET", `/api/search-suggest?q=${q.slice(0, i)}`, "sugerencias");
      page(`/buscar?q=${q}`, "buscar");
    });
  } else if (roll < 0.35) {
    group("explora", () => {
      page(pick(["/explorar", "/eventos", "/lugares", "/publicaciones", "/directorio", "/galerias"]), "seccion");
      showAd("listing");
    });
  }

  sleep(Math.random() * 3 + 1);
}

// Verificación previa: que el sitio y la API respondan antes de lanzar a la gente.
export function setup() {
  const web = http.get(`${WEB}/`);
  const api = http.get(`${API}/api/v1/feed?size=1`);
  if (web.status !== 200 || api.status !== 200) {
    throw new Error(`El stack no está listo: web ${web.status}, api ${api.status}`);
  }
}
