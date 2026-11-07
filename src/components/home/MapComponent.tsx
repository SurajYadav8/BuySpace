"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  JIO_WORLD_CENTRE,
  MUMBAI_BUILDINGS,
  type MumbaiBuilding,
} from "@/config/mumbai";

interface MapComponentProps {
  buildings?: MumbaiBuilding[];
  /** Fill parent height instead of fixed 560px stage */
  fill?: boolean;
}

export default function MapComponent({
  buildings = MUMBAI_BUILDINGS,
  fill = false,
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [popupInfo, setPopupInfo] = useState<MumbaiBuilding | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setMapError("Set NEXT_PUBLIC_MAPBOX_TOKEN in .env to load the map.");
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: JIO_WORLD_CENTRE.center,
        zoom: 15.2,
        pitch: 55,
        bearing: -20,
        antialias: true,
      });

      map.current = mapInstance;

      mapInstance.on("error", (e) => {
        setMapError(
          "Failed to load map: " + (e.error?.message || "Unknown error")
        );
      });

      mapInstance.on("load", () => {
        setMapLoaded(true);
        const data = buildings.length ? buildings : MUMBAI_BUILDINGS;

        data.forEach((building) => {
          const buildingFootprint: GeoJSON.Feature = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [building.footprint],
            },
            properties: building as unknown as GeoJSON.GeoJsonProperties,
          };

          mapInstance.addSource(`building-${building.id}`, {
            type: "geojson",
            data: buildingFootprint,
          });

          mapInstance.addLayer({
            id: `building-${building.id}-3d`,
            source: `building-${building.id}`,
            type: "fill-extrusion",
            paint: {
              "fill-extrusion-color": building.row === 1 ? "#1a2030" : "#2a3040",
              "fill-extrusion-height": building.height,
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.9,
            },
          });

          mapInstance.addLayer({
            id: `air-rights-${building.id}`,
            source: `building-${building.id}`,
            type: "fill-extrusion",
            paint: {
              "fill-extrusion-color": building.viewProtected
                ? "#0B8F6A"
                : "#C45C26",
              "fill-extrusion-height":
                building.height + building.airRightsVolume / 5000,
              "fill-extrusion-base": building.height,
              "fill-extrusion-opacity": 0.4,
            },
          });

          mapInstance.addSource(`building-point-${building.id}`, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: building.coordinates,
              },
              properties: building as unknown as GeoJSON.GeoJsonProperties,
            },
          });

          mapInstance.addLayer({
            id: `building-marker-${building.id}`,
            type: "circle",
            source: `building-point-${building.id}`,
            paint: {
              "circle-radius": 8,
              "circle-color": building.viewProtected ? "#0B8F6A" : "#C45C26",
              "circle-opacity": 0.9,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            },
          });

          mapInstance.on(
            "mousemove",
            `building-marker-${building.id}`,
            (
              e: mapboxgl.MapMouseEvent & {
                features?: mapboxgl.MapboxGeoJSONFeature[];
              }
            ) => {
              if (e.features?.length) {
                mapInstance.getCanvas().style.cursor = "pointer";
                setPopupInfo(building);
                mapInstance.setPaintProperty(
                  `air-rights-${building.id}`,
                  "fill-extrusion-opacity",
                  0.7
                );
              }
            }
          );

          mapInstance.on("mouseleave", `building-marker-${building.id}`, () => {
            mapInstance.getCanvas().style.cursor = "";
            setPopupInfo(null);
            mapInstance.setPaintProperty(
              `air-rights-${building.id}`,
              "fill-extrusion-opacity",
              0.4
            );
          });
        });

        new mapboxgl.Marker({ color: "#0B8F6A" })
          .setLngLat(JIO_WORLD_CENTRE.center)
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<strong>BuySpace · Mumbai</strong><br/>${JIO_WORLD_CENTRE.name}<br/><span style="opacity:.7">${JIO_WORLD_CENTRE.address}</span>`
            )
          )
          .addTo(mapInstance);

        requestAnimationFrame(() => mapInstance.resize());
      });

      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
    } catch (err) {
      setMapError(err instanceof Error ? err.message : "Map init failed");
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [buildings]);

  return (
    <div className={`relative w-full ${fill ? "h-full min-h-[360px]" : ""}`}>
      {!fill && (
        <div className="absolute left-4 top-4 z-10 max-w-[15rem] rounded-2xl border border-white/70 bg-white/92 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(10,15,26,0.12)] backdrop-blur-md">
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            ETHGlobal Mumbai
          </div>
          <div className="text-[13px] font-semibold text-ink">Air rights overlay</div>
          <div className="mt-1 text-[11px] text-ink-muted">Orange open · Green protected</div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/90">
          <p className="px-6 text-sm text-arkiv">{mapError}</p>
        </div>
      )}

      <div
        ref={mapContainer}
        className={`w-full overflow-hidden ${fill ? "h-full min-h-[360px]" : "h-[440px] md:h-[520px]"}`}
      />

      {popupInfo && (
        <div className="absolute bottom-4 left-4 right-4 z-10 border border-line bg-surface/95 p-4 backdrop-blur-md md:left-auto md:right-4 md:w-80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-ink">{popupInfo.name}</h4>
              <p className="mt-1 text-xs text-ink-muted">
                Floors {popupInfo.currentHeight} to {popupInfo.maximumHeight} · $
                {popupInfo.pricePerSqFt}/sqft
              </p>
            </div>
            <span
              className={`text-xs font-semibold ${
                popupInfo.viewProtected ? "text-primary" : "text-arkiv"
              }`}
            >
              {popupInfo.viewProtected ? "Protected" : "Open"}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {popupInfo.viewProtected
              ? "View corridor already protected"
              : "Available to tokenize on Hedera and lease via Arkiv"}
          </p>
        </div>
      )}

      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
          <div className="text-sm text-ink-muted">Loading Mumbai 3D map...</div>
        </div>
      )}
    </div>
  );
}
