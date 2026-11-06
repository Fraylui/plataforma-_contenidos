/**
 * Logo de la marca con su versión para modo oscuro (Configuración → Marca):
 * el navegador elige solo con prefers-color-scheme, sin JavaScript.
 */
export function BrandLogo({ logoUrl, logoDarkUrl, className }: { logoUrl: string; logoDarkUrl?: string | null; className: string }) {
  return (
    <picture className="contents">
      {logoDarkUrl && <source media="(prefers-color-scheme: dark)" srcSet={logoDarkUrl} />}
      <img src={logoUrl} alt="" className={className} />
    </picture>
  );
}
