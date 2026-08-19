"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Check, Loader2, MapPin, Navigation, Search, X } from "lucide-react";

interface LocationPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectLocation: (address: string, coordinates?: { lat: number; lng: number }) => void;
  initialLocation?: string;
}

interface GoongPrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

const POPULAR_HUBS = [
  "Quận 1, TP. Hồ Chí Minh",
  "Quận 3, TP. Hồ Chí Minh",
  "Thành phố Thủ Đức, TP. Hồ Chí Minh",
  "Quận Cầu Giấy, Hà Nội",
  "Quận Hoàn Kiếm, Hà Nội",
  "Quận Hải Châu, Đà Nẵng",
];

// Fallback raster OSM/Carto style if custom tiles fail
const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function LocationPickerDialog({
  open,
  onClose,
  onSelectLocation,
  initialLocation = "",
}: LocationPickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState(initialLocation);
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(initialLocation);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.7769,
    lng: 106.7009,
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const goongApiKey = process.env.NEXT_PUBLIC_GOONG_API_KEY || "7bWT40gj8VTkZ1INXSPPQk3CJG5tLg9jIgMayy3f";
  const goongMapKey = process.env.NEXT_PUBLIC_GOONG_MAP_KEY || "hkBRTOlzhKDE79Z6WGwQCgI9MTgsGXyUNC7jS8i3";

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${goongApiKey}`
      );
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const addr = data.results[0].formatted_address;
        setSelectedAddress(addr);
        setSearchQuery(addr);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  // Place detail helper
  const fetchPlaceDetail = async (placeId: string, description: string) => {
    try {
      const res = await fetch(
        `https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${goongApiKey}`
      );
      const data = await res.json();
      if (data.status === "OK" && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        setCoords({ lat, lng });
        setSelectedAddress(description);
        setSearchQuery(description);
        setPredictions([]);

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            speed: 1.5,
          });
        }
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        }
      }
    } catch (err) {
      console.error("Place detail error:", err);
    }
  };

  // Autocomplete search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(
          `https://rsapi.goong.io/Place/AutoComplete?api_key=${goongApiKey}&input=${encodeURIComponent(
            searchQuery
          )}&location=${coords.lat},${coords.lng}&limit=5`
        );
        const data = await res.json();
        if (data.status === "OK" && data.predictions) {
          setPredictions(data.predictions);
        } else {
          setPredictions([]);
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
        setPredictions([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, goongApiKey, coords.lat, coords.lng]);

  // Initialize Map
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const styleUrl = goongMapKey
        ? `https://tiles.goong.io/assets/goong_map_web.json?api_key=${goongMapKey}`
        : FALLBACK_STYLE;

      if (!mapRef.current) {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: styleUrl,
          center: [coords.lng, coords.lat],
          zoom: 13,
          attributionControl: false,
          scrollZoom: true,
          dragPan: true,
          dragRotate: true,
          touchZoomRotate: true,
          doubleClickZoom: true,
        });

        // Add Zoom & Compass controls
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
          "top-right"
        );

        // Fallback to OSM tiles if custom style fails
        map.on("error", () => {
          try {
            map.setStyle(FALLBACK_STYLE);
          } catch {
            // style fallback
          }
        });

        // Custom Marker
        const el = document.createElement("div");
        el.className =
          "flex size-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-2xl shadow-orange-500/60 border-2 border-white cursor-pointer";
        el.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

        const marker = new maplibregl.Marker({
          element: el,
          draggable: true,
        })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          setCoords({ lat: lngLat.lat, lng: lngLat.lng });
          reverseGeocode(lngLat.lat, lngLat.lng);
        });

        map.on("click", (e: maplibregl.MapMouseEvent) => {
          marker.setLngLat(e.lngLat);
          setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          reverseGeocode(e.lngLat.lat, e.lngLat.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        mapRef.current.resize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [open, goongMapKey, coords.lat, coords.lng]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!open && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (selectedAddress.trim()) {
      onSelectLocation(selectedAddress.trim(), coords);
      onClose();
    }
  };

  const handleQuickSelect = (addr: string) => {
    setSelectedAddress(addr);
    setSearchQuery(addr);
    setPredictions([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-[2rem] border border-border bg-card shadow-2xl overflow-hidden text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <MapPin className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Chọn địa điểm trên bản đồ</h3>
              <p className="text-xs text-muted-foreground">
                Tìm kiếm địa chỉ hoặc nhấp trực tiếp trên bản đồ để chọn vị trí
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search Bar & Auto-suggestions */}
        <div className="p-4 border-b border-border bg-muted/20 relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên đường, toà nhà, studio hoặc quận/huyện..."
              className="w-full rounded-xl border border-border bg-background pl-10 pr-10 py-2.5 text-xs focus:border-orange-500 focus:outline-none transition-colors"
            />
            {loadingSearch && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-orange-500 animate-spin" />
            )}
          </div>

          {/* Autocomplete Predictions Dropdown */}
          {predictions.length > 0 && (
            <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-xl p-1.5 space-y-1">
              {predictions.map((p) => (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => fetchPlaceDetail(p.place_id, p.description)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-xs hover:bg-orange-500/10 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <MapPin className="size-4 shrink-0 text-orange-500 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {p.structured_formatting?.main_text || p.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {p.structured_formatting?.secondary_text || p.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Hub Chips */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
              Gợi ý nhanh:
            </span>
            {POPULAR_HUBS.map((hub) => (
              <button
                key={hub}
                type="button"
                onClick={() => handleQuickSelect(hub)}
                className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-orange-500/50 hover:text-orange-500 transition-colors cursor-pointer"
              >
                {hub}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas with Wheel & Touch event isolation */}
        <div
          className="relative h-64 sm:h-80 w-full bg-muted select-none"
          onWheel={(e) => e.stopPropagation()}
        >
          <div ref={mapContainerRef} className="size-full" />
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-xs border border-border/80 shadow-xs pointer-events-none">
            <Navigation className="size-3 text-orange-500" />
            <span>Kéo ghim hoặc click bản đồ để chọn</span>
          </div>
        </div>

        {/* Selected Location Summary & Confirm Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border p-4 bg-card">
          <div className="w-full sm:w-auto min-w-0">
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
              Địa điểm đã chọn:
            </span>
            <p className="text-xs font-semibold text-foreground truncate max-w-md">
              {selectedAddress || "Chưa chọn địa điểm"}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedAddress.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Check className="size-4" />
              <span>Xác nhận địa điểm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
