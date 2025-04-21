import React, { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Garage } from "../types";

interface GarageMapProps {
  garages: Garage[];
  height?: string;
  width?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  onGarageSelect?: (garage: Garage) => void;
}

// Default Miami coordinates
const defaultCenter = { lat: 25.7617, lng: -80.1918 };

// Mock function to convert addresses to coordinates (in real app, use geocoding API)
const getCoordinates = (location: string) => {
  // This is just a mock function to generate coordinates around Miami
  // In a real app, you would use a geocoding service
  const baseCoords = { ...defaultCenter };
  // Add some random offset to spread markers around
  const latOffset = (Math.random() - 0.5) * 0.05;
  const lngOffset = (Math.random() - 0.5) * 0.05;
  
  return {
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset
  };
};

const GarageMap: React.FC<GarageMapProps> = ({
  garages,
  height = "400px",
  width = "100%",
  center = defaultCenter,
  zoom = 13,
  onGarageSelect
}) => {
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // Use env var, provide empty string fallback
    libraries: ["places"]
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  const handleMarkerClick = (garage: Garage) => {
    setSelectedGarage(garage);
    if (onGarageSelect) {
      onGarageSelect(garage);
    }
  };

  if (loadError) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div className="p-4 flex justify-center items-center">Loading maps...</div>;
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={{ width, height }}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true
        }}
      >
        {garages.map((garage) => {
          // Get coordinates from garage location (mock implementation)
          const position = getCoordinates(garage.location);
          
          return (
            <Marker
              key={garage.id}
              position={position}
              onClick={() => handleMarkerClick(garage)}
            />
          );
        })}

        {selectedGarage && (
          <InfoWindow
            position={getCoordinates(selectedGarage.location)}
            onCloseClick={() => setSelectedGarage(null)}
          >
            <div className="p-2 max-w-[250px]">
              <h3 className="font-semibold">{selectedGarage.name}</h3>
              <p className="text-sm text-gray-600">{selectedGarage.address}</p>
              <div className="flex items-center mt-1 text-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                  <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="ml-1">{selectedGarage.rating}</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default GarageMap;
