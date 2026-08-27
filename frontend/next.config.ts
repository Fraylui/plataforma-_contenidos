import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagen Docker (backend/Dockerfile hermano): empaqueta solo el server y
  // las dependencias de producción realmente usadas, no todo node_modules.
  output: "standalone",
};

export default nextConfig;
