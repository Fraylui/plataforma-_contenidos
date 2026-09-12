// Test de performance de página (Core Web Vitals) con Lighthouse CI contra
// el frontend real ya desplegado (Docker/staging). Distinto de k6 (que mide
// la API): esto mide lo que un visitante realmente experimenta —
// renderizado, JS, imágenes.
//
// Uso: npx lhci autorun (con el stack levantado en localhost:3000)
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/publicaciones",
        "http://localhost:3000/lugares",
      ],
      numberOfRuns: 3,
      settings: { preset: "desktop" },
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
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
