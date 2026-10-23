import { AdminApiError } from "@/lib/api/admin/http";

/**
 * Para lecturas del panel restringidas por permisos (cada módulo exige el
 * suyo, ver ): la nav ya oculta el link para
 * quien no tiene el permiso, pero eso no impide navegar directo a la URL, o que
 * el rol cambie a mitad de sesión. Sin esto, ese 403 legítimo se propagaba
 * sin capturar hasta la boundary de error genérica ("puede ser temporal,
 * reintenta"), que es engañoso para un caso de permisos, no una falla
 * transitoria. Encontrado en la revisión de código de esta fase.
 */
export async function fetchOrAccessDenied<T>(call: () => Promise<T>): Promise<{ data: T } | { denied: true }> {
  try {
    return { data: await call() };
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403) {
      return { denied: true };
    }
    throw error;
  }
}
