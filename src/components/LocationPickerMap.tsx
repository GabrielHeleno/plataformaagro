import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Crosshair,
  Search,
  Layers,
  Check,
  X,
  Maximize2,
  Minimize2,
  Navigation,
  AlertCircle,
  HelpCircle,
  Compass,
} from 'lucide-react';
import {
  parseCoordinates,
  formatCoordinates,
  DEFAULT_MAP_CENTER,
  DEFAULT_CITY_LABEL,
  LatLngCoords,
} from '../utils/geoUtils';

interface LocationPickerMapProps {
  initialCoordinates?: string;
  onConfirm: (coordsFormatted: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

// Cria ícone SVG nítido e responsivo para o Leaflet sem depender de arquivos PNG externos
const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 36px; height: 42px; transform: translate(-50%, -100%);">
        <svg viewBox="0 0 36 42" width="36" height="42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 4px rgba(0,0,0,0.45));">
          <path d="M18 0C8.05888 0 0 8.05888 0 18C0 27.24 15.4286 40.5429 16.8 41.6571C17.5143 42.2286 18.4857 42.2286 19.2 41.6571C20.5714 40.5429 36 27.24 36 18C36 8.05888 27.9411 0 18 0Z" fill="#dc2626"/>
          <circle cx="18" cy="17" r="7" fill="#ffffff"/>
          <circle cx="18" cy="17" r="4.2" fill="#0f766e"/>
        </svg>
        <div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 8px; height: 3px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1px);"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

type MapLayerType = 'hybrid' | 'satellite' | 'streets';

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialCoordinates,
  onConfirm,
  onCancel,
  isModal = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Camadas de alta fidelidade
  const hybridLayerRef = useRef<L.TileLayer | null>(null);
  const satellitePureLayerRef = useRef<L.TileLayer | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);

  const initialParsed = parseCoordinates(initialCoordinates || '');
  // Se não houver coordenadas anteriores, abre sempre em Cipotânea - MG
  const [selectedCoords, setSelectedCoords] = useState<LatLngCoords>(
    initialParsed || DEFAULT_MAP_CENTER
  );
  const [hasMarker, setHasMarker] = useState<boolean>(!!initialParsed);
  const [mapType, setMapType] = useState<MapLayerType>('hybrid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Inicializa mapa e camadas do Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Padrão: Sempre Cipotânea - MG se não houver coordenada salva
    const startPos = initialParsed || DEFAULT_MAP_CENTER;
    const initialZoom = initialParsed ? 15 : 14;

    const map = L.map(mapContainerRef.current, {
      center: [startPos.lat, startPos.lng],
      zoom: initialZoom,
      maxZoom: 21,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 1. Satélite HD Híbrido (Google Satellite + Airbus/Pleiades/CNES de alta frequência com nomes de estradas rurais e divisas)
    const hybridLayer = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 21,
        maxNativeZoom: 20,
        attribution: 'Google • Airbus • CNES',
      }
    );

    // 2. Satélite Puro (sem rótulos)
    const satellitePureLayer = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 21,
        maxNativeZoom: 20,
        attribution: 'Google • Airbus • CNES',
      }
    );

    // 3. Camada de Ruas (OpenStreetMap)
    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }
    );

    hybridLayerRef.current = hybridLayer;
    satellitePureLayerRef.current = satellitePureLayer;
    streetLayerRef.current = streetLayer;

    // Satélite HD Híbrido ativado por padrão
    hybridLayer.addTo(map);

    // Cria o marcador caso já existam coordenadas ou quando usuário clica
    const pinIcon = createCustomPinIcon();

    const updatePinPosition = (lat: number, lng: number) => {
      setSelectedCoords({ lat, lng });
      setHasMarker(true);

      if (!markerRef.current) {
        const marker = L.marker([lat, lng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setSelectedCoords({ lat: pos.lat, lng: pos.lng });
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
    };

    if (initialParsed) {
      updatePinPosition(initialParsed.lat, initialParsed.lng);
    }

    // Clique no mapa para posicionar ou mover o Pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      updatePinPosition(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Altera camada ativa do mapa
  const switchLayer = (type: MapLayerType) => {
    if (
      !mapInstanceRef.current ||
      !hybridLayerRef.current ||
      !satellitePureLayerRef.current ||
      !streetLayerRef.current
    )
      return;

    const map = mapInstanceRef.current;
    map.removeLayer(hybridLayerRef.current);
    map.removeLayer(satellitePureLayerRef.current);
    map.removeLayer(streetLayerRef.current);

    setMapType(type);

    if (type === 'hybrid') {
      hybridLayerRef.current.addTo(map);
    } else if (type === 'satellite') {
      satellitePureLayerRef.current.addTo(map);
    } else {
      streetLayerRef.current.addTo(map);
    }
  };

  // Centraliza no Pin existente
  const handleCenterOnPin = () => {
    if (!mapInstanceRef.current || !hasMarker) return;
    mapInstanceRef.current.flyTo([selectedCoords.lat, selectedCoords.lng], 16, {
      duration: 1,
    });
  };

  // Atalho direto: Voar para Cipotânea - MG
  const handleGoToCipotanea = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      14,
      { duration: 1.2 }
    );
  };

  // Captura localização atual do GPS do dispositivo
  const handleGetDeviceGPS = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocalização não suportada pelo navegador.');
      return;
    }

    setLocatingUser(true);
    setSearchError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const { latitude, longitude } = pos.coords;
        setSelectedCoords({ lat: latitude, lng: longitude });
        setHasMarker(true);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
          if (!markerRef.current) {
            const marker = L.marker([latitude, longitude], {
              icon: createCustomPinIcon(),
              draggable: true,
            }).addTo(mapInstanceRef.current);

            marker.on('dragend', () => {
              const p = marker.getLatLng();
              setSelectedCoords({ lat: p.lat, lng: p.lng });
            });
            markerRef.current = marker;
          } else {
            markerRef.current.setLatLng([latitude, longitude]);
          }
        }
      },
      (err) => {
        setLocatingUser(false);
        setSearchError('Não foi possível obter sua localização atual: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Busca rápida de município ou localidade
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim() + ', Minas Gerais, Brasil'
        )}&limit=1`,
        {
          headers: {
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
        }
      );

      if (!response.ok) throw new Error('Falha no serviço de busca.');
      const data = await response.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.5 });
          setSelectedCoords({ lat, lng });
          setHasMarker(true);

          if (!markerRef.current) {
            const marker = L.marker([lat, lng], {
              icon: createCustomPinIcon(),
              draggable: true,
            }).addTo(mapInstanceRef.current);

            marker.on('dragend', () => {
              const p = marker.getLatLng();
              setSelectedCoords({ lat: p.lat, lng: p.lng });
            });
            markerRef.current = marker;
          } else {
            markerRef.current.setLatLng([lat, lng]);
          }
        }
      } else {
        setSearchError('Local não encontrado. Tente o nome de uma localidade ou comunidade.');
      }
    } catch (err: any) {
      setSearchError('Erro ao buscar endereço: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmCoords = () => {
    const formatted = formatCoordinates(selectedCoords.lat, selectedCoords.lng);
    onConfirm(formatted);
  };

  const containerStyle = isFullscreen
    ? 'fixed inset-0 z-70 bg-zinc-900/90 flex flex-col p-2 sm:p-4'
    : isModal
    ? 'flex flex-col h-[540px] max-h-[85vh] w-full'
    : 'flex flex-col h-[400px] w-full rounded-xl border border-zinc-300 overflow-hidden';

  return (
    <div className={containerStyle}>
      <div className="bg-zinc-900 text-white p-3 rounded-t-xl flex flex-col gap-2.5 shadow-md shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                <span>Marcar Localização com Pin</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-semibold">
                  Satélite HD • {DEFAULT_CITY_LABEL}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Imagens de alta resolução. Clique para espetar o pin ou arraste o marcador vermelho até a propriedade.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
              }}
              className="p-1.5 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors"
              title={isFullscreen ? 'Reduzir' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                title="Fechar mapa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de Ações: Busca + Seletor Satélite HD / Ruas + Botão Cipotânea + GPS */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {/* Campo de Busca */}
          <form onSubmit={handleSearchAddress} className="flex-1 min-w-[190px] flex items-center gap-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar bairro, comunidade ou região..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 text-white text-xs rounded-lg border border-zinc-700 focus:outline-none focus:border-emerald-500 placeholder-zinc-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {/* Alternador de Camadas: Satélite HD (Híbrido) / Satélite Puro / Ruas */}
          <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
            <button
              type="button"
              onClick={() => switchLayer('hybrid')}
              className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                mapType === 'hybrid'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Satélite em alta definição com nomes de estradas rurais e comunidades (Airbus/Google HD)"
            >
              <Layers className="w-3 h-3 text-emerald-300" />
              <span>Satélite HD</span>
            </button>
            <button
              type="button"
              onClick={() => switchLayer('satellite')}
              className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                mapType === 'satellite'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Satélite puro sem sobreposições de nomes"
            >
              <span>Satélite Puro</span>
            </button>
            <button
              type="button"
              onClick={() => switchLayer('streets')}
              className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                mapType === 'streets'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Ruas</span>
            </button>
          </div>

          {/* Botão de Atalho Rápido para Cipotânea - MG */}
          <button
            type="button"
            onClick={handleGoToCipotanea}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 hover:text-white text-xs font-bold rounded-lg border border-emerald-700/60 transition-colors shadow-xs"
            title="Voltar o mapa para o centro de Cipotânea - MG"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cipotânea</span>
          </button>

          {/* Botão GPS Dispositivo */}
          <button
            type="button"
            onClick={handleGetDeviceGPS}
            disabled={locatingUser}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg border border-emerald-600 transition-colors disabled:opacity-50"
            title="Posicionar no meu GPS atual"
          >
            <Navigation className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
            <span>{locatingUser ? 'Localizando...' : 'Meu GPS'}</span>
          </button>
        </div>

        {searchError && (
          <div className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-800 px-2 py-1 rounded flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Área do Mapa Leaflet */}
      <div className="relative flex-1 w-full min-h-[280px] bg-zinc-900">
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

        {/* Botão flutuante para centralizar no Pin */}
        {hasMarker && (
          <button
            type="button"
            onClick={handleCenterOnPin}
            className="absolute top-3 right-3 z-10 p-2 bg-white/95 hover:bg-white text-zinc-800 rounded-lg shadow-md border border-zinc-200 transition-all flex items-center gap-1 text-xs font-bold"
            title="Centralizar mapa no marcador"
          >
            <Crosshair className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Centralizar no Pin</span>
          </button>
        )}

        {/* Dica flutuante sobre arrastar */}
        <div className="absolute bottom-2 left-2 z-10 bg-zinc-950/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5 pointer-events-none shadow-md">
          <HelpCircle className="w-3 h-3 text-emerald-400" />
          <span>Dica: clique em qualquer ponto do mapa ou arraste o pin vermelho</span>
        </div>
      </div>

      {/* Barra Inferior com Coordenadas Atuais e Confirmação */}
      <div className="bg-zinc-50 border-t border-zinc-200 p-3 rounded-b-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse shrink-0"></div>
          <div>
            <div className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              Coordenadas Selecionadas ({DEFAULT_CITY_LABEL}):
            </div>
            <div className="font-mono font-bold text-xs sm:text-sm text-zinc-900">
              {formatCoordinates(selectedCoords.lat, selectedCoords.lng)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-300 bg-white"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmCoords}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Localização</span>
          </button>
        </div>
      </div>
    </div>
  );
};
