import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * true recién después de hidratar en el navegador — para componentes que
 * necesitan `document` (ej. un portal). `useSyncExternalStore` en vez de
 * `useEffect(() => setState(true))`: llamar setState sincrónico dentro de
 * un efecto dispara renders en cascada (regla del compilador de React) y
 * además tarda un ciclo de render extra; esto resuelve en la misma pasada
 * de hidratación, sin el "flash" de un render de más.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
