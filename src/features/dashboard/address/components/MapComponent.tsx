"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface MapComponentProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function MapComponent({
  latitude,
  longitude,
  onLocationSelect,
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS and JS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.async = true;
    script.onload = () => {
      initializeMap();
    };
    script.onerror = () => {
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
        document.head.removeChild(link);
      } catch (e) {
        // Already removed
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current) return;

    try {
      const L = (window as any).L;

      if (!L) {
        setIsLoading(false);
        return;
      }

      // Initialize map
      mapRef.current = L.map(mapContainer.current).setView(
        [latitude, longitude],
        15,
      );

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add marker
      markerRef.current = L.marker([latitude, longitude], {
        draggable: true,
      }).addTo(mapRef.current);

      // Handle marker drag
      markerRef.current.on("dragend", () => {
        const position = markerRef.current.getLatLng();
        const newLat = position.lat;
        const newLng = position.lng;
        console.log("[v0] Marker moved to:", newLat, newLng);
        onLocationSelect(newLat, newLng);
      });

      // Handle map click
      mapRef.current.on("click", (event: any) => {
        const { lat, lng } = event.latlng;
        console.log("[v0] Map clicked at:", lat, lng);

        // Move marker
        markerRef.current.setLatLng([lat, lng]);

        // Callback
        onLocationSelect(lat, lng);
      });

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      try {
        const L = (window as any).L;
        const newPosition = [latitude, longitude];
        markerRef.current.setLatLng(newPosition);
        mapRef.current.panTo(newPosition);
        console.log("[v0] Position updated to:", latitude, longitude);
      } catch (error) {
        console.error("[v0] Error updating position:", error);
      }
    }
  }, [latitude, longitude]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-b-lg"
      style={{ height: "500px" }}
    >
      <div
        ref={mapContainer}
        className="bg-muted h-full w-full"
        style={{ minHeight: "500px" }}
      />

      {isLoading && (
        <div className="bg-background/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading map...</p>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {!isLoading && (
        <div className="absolute right-4 bottom-4 left-4 rounded-lg bg-black/70 px-3 py-2 text-sm text-white backdrop-blur-sm">
          Click or drag marker to select your delivery location
        </div>
      )}
    </div>
  );
}
