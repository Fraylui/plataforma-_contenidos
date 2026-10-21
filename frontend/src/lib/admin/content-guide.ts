/**
 * Qué se puede publicar (decisión del dueño 2026-10-21). Una sola fuente
 * para la página del panel y la tarjeta «Antes de publicar» de los
 * compositores. Base: CONTEXTO.md §35.2 (marco legal) y §46 (publicidad).
 * Resumen práctico, no asesoría legal.
 */
export interface GuideRule {
  title: string;
  /** Por qué existe la regla (ley o política), en una línea. */
  basis?: string;
  yes?: string[];
  no?: string[];
}

export const CONTENT_GUIDE: GuideRule[] = [
  {
    title: "Sí se publica",
    yes: [
      "Lugares, historia, cultura y tradiciones, curiosidades, animales, tecnología y fechas que se celebran.",
      "Lo que cuentas tú, con tus fotos y videos, o con material que tienes permiso de usar.",
      "Datos útiles para quien visita: cómo llegar, horarios públicos, por qué vale la pena.",
    ],
  },
  {
    title: "Nada de promoción gratis de negocios",
    basis: "Regla de la plataforma: lo comercial llega solo como anuncio pagado y marcado.",
    no: [
      "Publicaciones, lugares o celebraciones para promocionar una empresa, un local o una marca.",
      "Precios, ofertas, descuentos, teléfonos, WhatsApp o «pide aquí» de un negocio.",
      "Eventos comerciales (conciertos, ferias con entrada, lanzamientos) como si fueran celebraciones.",
    ],
    yes: ["Mencionar un negocio solo como dato del lugar (por ejemplo, «junto al mercado central»), sin oferta ni contacto."],
  },
  {
    title: "Si hubo pago o canje, es publicidad",
    basis: "D.L. 1044, art. 16 (autenticidad) y Guía de Publicidad para Influencers de Indecopi: la publicidad encubierta se sanciona.",
    no: ["Publicar como contenido algo por lo que te pagaron o te dieron algo a cambio: dinero, entradas, canje, descuentos, viajes."],
    yes: ["Eso va en Publicidad como anuncio «Patrocinado», con el anunciante y sus condiciones."],
  },
  {
    title: "Fotos, videos y textos",
    basis: "D.L. 822 (derecho de autor).",
    yes: [
      "Tus fotos y textos, o material con licencia o permiso; di de dónde viene cuando no es tuyo.",
      "Videos de YouTube insertados (sus términos lo permiten).",
    ],
    no: ["Copiar textos o fotos de otros sitios o redes sin permiso, aunque estén en internet."],
  },
  {
    title: "Personas y datos personales",
    basis: "Ley 29733 de protección de datos personales y su reglamento.",
    no: [
      "Datos de terceros sin su permiso: DNI, teléfono, dirección, salud, situación económica.",
      "Fotos donde se reconozca a niñas o niños sin permiso de sus padres.",
    ],
    yes: ["Fotos de multitudes en espacios públicos y de personas que aceptaron salir."],
  },
  {
    title: "Rubros sensibles",
    basis: "Leyes 28681 (alcohol), 31557 (apuestas) y 30021 (alimentos procesados): sus anuncios llevan advertencias obligatorias.",
    no: ["Promover alcohol, apuestas o comida chatarra como contenido. Si un anunciante de esos rubros quiere salir, va como anuncio y con su advertencia."],
  },
  {
    title: "Reglas de Google AdSense",
    basis: "Si se incumplen, Google puede cerrar la cuenta de anuncios (el ingreso del sitio).",
    no: [
      "Contenido para adultos, violencia gráfica, odio o acoso, drogas o armas.",
      "Información falsa o engañosa, o títulos que prometen algo que el contenido no da.",
      "Pedir que hagan clic en los anuncios o ponerlos donde se confundan con el contenido.",
    ],
  },
];

export const GUIDE_DISCLAIMER =
  "Resumen práctico para publicar con tranquilidad; no es asesoría legal. Ante una duda concreta, consúltalo con un abogado.";
