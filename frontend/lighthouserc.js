// Test de performance de página (Core Web Vitals) con Lighthouse CI contra
// el frontend real ya desplegado (Docker/staging). Distinto de k6 (que mide
// la API): esto mide lo que un visitante realmente experimenta —
// renderizado, JS, imágenes.
//
// Uso: npx lhci autorun (con el stack levantado en localhost:3000)
module.exports = {
  ci: {
    collect: {
      // Rediseño 2026-10-06: las pantallas de la plataforma (feed, cuadrícula
      // y una vista de post). LHCI_DETAIL_URL permite medir otro detalle en
      // otra base (el slug de ejemplo existe en la base local).
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/explorar",
        "http://localhost:3000/lugares",
        process.env.LHCI_DETAIL_URL ?? "http://localhost:3000/eventos/concierto-de-jazz-en-el-jardin-botanico",
      ],
      numberOfRuns: 3,
      // Sin preset = perfil móvil de Lighthouse (celular de gama media, red
      // 4G lenta): la mayoría de las visitas son de celular, y es el perfil
      // que Google usa para el ranking.
    },
    assert: {
      assertions: {
        // Un sitio de contenidos con meta AdSense vive o muere por Core
        // Web Vitals (afectan ranking y CPM) — umbrales alineados a "Good"
        // de Google, no aspiracionales.
        "categories:performance": ["error", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        // INP no se mide en laboratorio (necesita interacciones reales); el
        // TBT es su indicador en Lighthouse. INP real: Search Console / CrUX.
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
