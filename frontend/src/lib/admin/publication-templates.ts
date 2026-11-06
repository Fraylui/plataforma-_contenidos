import type { PublicationType } from "@/lib/api/types";

export type TemplateKey = "lista" | "guia" | "tutorial" | "historia";

export interface PublicationTemplate {
  key: TemplateKey;
  label: string;
  /** Para qué sirve, en una línea. */
  description: string;
  type: PublicationType;
  /** Estructura inicial del texto: títulos y guías entre corchetes para reemplazar. */
  body: string;
}

/**
 * Plantillas para no empezar con la página en blanco. Solo arman la
 * estructura (secciones y pasos); el texto entre corchetes se reemplaza.
 * HTML simple que el editor y el saneado del backend aceptan (h2, p, ul, ol, li, strong).
 */
export const PUBLICATION_TEMPLATES: PublicationTemplate[] = [
  {
    key: "lista",
    label: "Lista",
    description: "«7 lugares para…», «10 platos que…»: un punto por sección.",
    type: "LISTA",
    body: [
      "<p>[Una o dos frases: qué vas a mostrar y por qué vale la pena.]</p>",
      "<h2>1. [Nombre]</h2><p>[Qué es y por qué está en la lista.]</p>",
      "<h2>2. [Nombre]</h2><p>[Qué es y por qué está en la lista.]</p>",
      "<h2>3. [Nombre]</h2><p>[Qué es y por qué está en la lista.]</p>",
      "<h2>4. [Nombre]</h2><p>[Qué es y por qué está en la lista.]</p>",
      "<h2>5. [Nombre]</h2><p>[Qué es y por qué está en la lista.]</p>",
    ].join(""),
  },
  {
    key: "guia",
    label: "Guía",
    description: "Todo para ir a un lugar o vivir una experiencia: llegar, hacer, costos y consejos.",
    type: "GUIA",
    body: [
      "<p>[Qué es y para quién es esta guía.]</p>",
      "<h2>Cómo llegar</h2><p>[Desde dónde, en qué y cuánto tiempo.]</p>",
      "<h2>Qué hacer</h2><ul><li>[Actividad]</li><li>[Actividad]</li><li>[Actividad]</li></ul>",
      "<h2>Cuánto cuesta</h2><p>[Entradas, transporte, comida: montos aproximados en soles.]</p>",
      "<h2>Mejor época para ir</h2><p>[Meses y por qué.]</p>",
      "<h2>Consejos</h2><ul><li>[Consejo]</li><li>[Consejo]</li></ul>",
    ].join(""),
  },
  {
    key: "tutorial",
    label: "Tutorial",
    description: "Cómo hacer algo paso a paso: qué necesitas, los pasos y el resultado.",
    type: "TUTORIAL",
    body: [
      "<p>[Qué vas a lograr al terminar.]</p>",
      "<h2>Qué necesitas</h2><ul><li>[Material o herramienta]</li><li>[Material o herramienta]</li></ul>",
      "<h2>Paso 1: [título corto]</h2><p>[Qué hacer.]</p>",
      "<h2>Paso 2: [título corto]</h2><p>[Qué hacer.]</p>",
      "<h2>Paso 3: [título corto]</h2><p>[Qué hacer.]</p>",
      "<h2>Errores comunes</h2><ul><li>[Error y cómo evitarlo]</li></ul>",
    ].join(""),
  },
  {
    key: "historia",
    label: "Historia",
    description: "El origen de una tradición, un plato o un lugar, contado de principio a fin.",
    type: "HISTORIA",
    body: [
      "<p>[Empieza con un momento o un dato que atrape.]</p>",
      "<h2>Cómo empezó</h2><p>[El origen.]</p>",
      "<h2>Cómo cambió</h2><p>[Lo que pasó con el tiempo.]</p>",
      "<h2>Hoy</h2><p>[Cómo se vive ahora y dónde verlo.]</p>",
    ].join(""),
  },
];

export function findTemplate(value: string | string[] | undefined): PublicationTemplate | undefined {
  const key = Array.isArray(value) ? value[0] : value;
  return PUBLICATION_TEMPLATES.find((template) => template.key === key);
}
