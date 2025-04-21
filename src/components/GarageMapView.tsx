import React from "react";
import GarageMap from "./GarageMap";
import { Garage } from "../types";

interface GarageMapViewProps {
  garages: Garage[];
  height?: string;
  onGarageSelect?: (garage: Garage) => void;
}

const GarageMapView: React.FC<GarageMapViewProps> = ({
  garages,
  height = "400px",
  onGarageSelect
}) => {
  return (
    <div>
      <GarageMap 
        garages={garages} 
        height={height} 
        onGarageSelect={onGarageSelect}
      />
    </div>
  );
};

export default GarageMapView;
