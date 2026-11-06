"use client";

import { lazy, type ComponentType } from "react";

/**
 * Menús y paneles del sitio público (Buscar, Más, Información) que nadie usa
 * al entrar: su librería (Radix) no va en el paquete inicial. Se muestra un
 * botón igual y, al tocarlo, se monta el componente real ya abierto. Se
 * precarga al pasar el mouse o enfocar el botón, para que no se note
 * (LCP: menos JavaScript que ejecutar al cargar, 2026-10-16).
 */
export function lazyPopup<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  return { Component: lazy(load), preload: () => void load() };
}
