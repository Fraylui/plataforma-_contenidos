"use client";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Los iconos por defecto de Leaflet apuntan a rutas relativas que el bundler
// no resuelve — se reemplazan por los mismos assets servidos desde unpkg en
// vez de pelear con la configuración de assets de Next para 3 íconos.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const WORLD_CENTER: [number, number] = [20, 0];
const WORLD_ZOOM = 2;
const PIN_ZOOM = 15;

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Selector de ubicación por clic en el mapa (OpenStreetMap vía Leaflet, sin
 * API key) — antes Latitud/Longitud eran dos <input type="number"> sueltos
 * pidiendo decimales de memoria, lo opuesto a "intuitivo" para cargar
 * contenido rápido. Los inputs numéricos siguen existiendo junto a este
 * componente (útil para pegar coordenadas copiadas de otro lado); ambos
 * caminos escriben al mismo estado.
 */
export function LocationPicker({
  latitude,
  longitude,
  disabled,
  onChange,
}: {
  latitude: string;
  longitude: string;
  disabled?: boolean;
  onChange: (lat: string, lng: string) => void;
}) {
  const parsedLat = Number(latitude);
  const parsedLng = Number(longitude);
  const hasPin = latitude.trim() !== "" && longitude.trim() !== "" && !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng);
  const center: [number, number] = hasPin ? [parsedLat, parsedLng] : WORLD_CENTER;

  return (
    <div className={`overflow-hidden rounded-md border border-border ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      {/* key: remonta el mapa solo al pasar de "sin pin" a "con pin" (primera
          carga con datos existentes) — Leaflet no recentra solo si `center`
          cambia después de montado, y no querémos remontar en cada tecleo. */}
      <MapContainer
        key={hasPin ? "pin" : "empty"}
        center={center}
        zoom={hasPin ? PIN_ZOOM : WORLD_ZOOM}
        style={{ height: "220px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPin && <Marker position={center} />}
        <ClickHandler onPick={(lat, lng) => onChange(lat.toFixed(6), lng.toFixed(6))} />
      </MapContainer>
    </div>
  );
}
