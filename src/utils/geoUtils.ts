/**
 * Utilitários para parsing, validação e manipulação de coordenadas geográficas
 */

export interface LatLngCoords {
  lat: number;
  lng: number;
}

/**
 * Extrai latitude e longitude de uma string, que pode ser:
 * - "-18.5789, -46.5180"
 * - "-18.5789 -46.5180"
 * - Link do Google Maps: "...query=-18.5789,-46.5180..." ou ".../@-18.5789,-46.5180..."
 */
export function parseCoordinates(input: string): LatLngCoords | null {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // Caso 1: Link do Google Maps contendo /@lat,lng ou ?q=lat,lng ou query=lat,lng
  const urlMatch = str.match(/(@|query=|q=|loc:|\/place\/)(-?\d+\.\d+),\s*(-?\d+\.\d+)/i);
  if (urlMatch && urlMatch[2] && urlMatch[3]) {
    const lat = parseFloat(urlMatch[2]);
    const lng = parseFloat(urlMatch[3]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // Caso 2: Dois números decimais com vírgula ou espaço separando
  const directMatch = str.match(/(-?\d+\.?\d*)\s*[,;\s]\s*(-?\d+\.?\d*)/);
  if (directMatch && directMatch[1] && directMatch[2]) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  return null;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function formatCoordinates(lat: number, lng: number, decimals = 6): string {
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}

/**
 * Ponto padrão de inicialização: Cipotânea - MG
 * Coordenadas: 20°54'11"S 43°21'48"W (-20.9031, -43.3633)
 */
export const DEFAULT_MAP_CENTER: LatLngCoords = {
  lat: -20.9031,
  lng: -43.3633,
};

export const DEFAULT_CITY_LABEL = 'Cipotânea - MG';
