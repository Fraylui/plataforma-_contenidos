/**
 * El campo de color de Configuración de plataforma es texto libre en la
 * base de datos (viene de antes de que existiera un selector real) — no
 * se puede asumir que sea un hex válido. Aplicar un valor inválido como
 * variable CSS no rompe el parseo, pero cualquier `var(--accent)` que lo
 * use se vuelve "invalid at computed-value time" y pierde el color en
 * todo el sitio, así que se valida antes de aplicarlo.
 */
export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

/**
 * Color de texto legible (blanco o casi-negro) sobre un color de acento
 * arbitrario definido en Configuración de plataforma — el acento de marca
 * fijo (#B91C1C/#EF4444) ya se eligió con buen contraste para texto
 * blanco, pero un color elegido libremente por el usuario en el admin
 * puede ser claro, así que hay que decidirlo en base al color real.
 */
export function contrastingForeground(hex: string): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return "#ffffff";
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness > 0.6 ? "#111111" : "#ffffff";
}
