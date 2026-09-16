/**
 * Mensaje de error de formulario — antes copiado como `text-red-600
 * dark:text-red-400` en 12+ formularios, un rojo fijo fuera del sistema de
 * tokens (--danger ya cubre ambos temas, ver globals.css). Un solo punto de
 * verdad para el estilo, igual que FormField para los labels.
 */
export function FormError({ message, className = "" }: { message: string; className?: string }) {
  return (
    <p role="alert" className={`text-sm text-danger ${className}`}>
      {message}
    </p>
  );
}
