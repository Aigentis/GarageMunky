
import { Vehicle } from "../types";
import { Calendar, AlertTriangle, Car, Info, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface VehicleCardProps {
  vehicle: Vehicle;
  showDetails?: boolean;
  onServiceClick?: () => void;
  onDetailsClick?: () => void;
}

const VehicleCard = ({ vehicle, showDetails = true, onServiceClick, onDetailsClick }: VehicleCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "expired":
        return "text-red-500 bg-red-900/30 border-red-500";
      case "expiring_soon":
        return "text-amber-400 bg-amber-900/30 border-amber-500";
      case "valid":
        return "text-green-400 bg-green-900/30 border-green-500";
      default:
        return "text-gray-300 bg-gray-800/50 border-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const motStatusClass = getStatusColor(vehicle.motStatus);
  const taxStatusClass = getStatusColor(vehicle.taxStatus);

  return (
    <div className="bg-black/50 rounded-2xl p-5 overflow-hidden border border-white/20 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-white">{vehicle.make} {vehicle.model}</h3>
        <span className="text-sm bg-primary/90 text-white rounded-full px-3 py-1 font-medium">
          {vehicle.registration}
        </span>
      </div>

      {vehicle.image ? (
        <div className="relative h-48 mb-4 rounded-xl overflow-hidden border border-white/10">
          <img 
            src={vehicle.image} 
            alt={`${vehicle.make} ${vehicle.model}`} 
            className="w-full h-full object-cover" 
          />
        </div>
      ) : (
        <div className="relative h-48 mb-4 rounded-xl overflow-hidden border border-white/10 bg-gray-800/50 flex items-center justify-center">
          <Car size={64} className="text-gray-500" />
        </div>
      )}

      {showDetails && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3 rounded-xl flex items-center border ${motStatusClass}`}>
              <div className="mr-3">
                {vehicle.motStatus === 'valid' ? (
                  <Calendar size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div>
                <p className="text-xs opacity-80">MOT</p>
                <p className="text-sm font-medium">{formatDate(vehicle.motExpiryDate)}</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-xl flex items-center border ${taxStatusClass}`}>
              <div className="mr-3">
                {vehicle.taxStatus === 'valid' ? (
                  <Calendar size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div>
                <p className="text-xs opacity-80">Road Tax</p>
                <p className="text-sm font-medium">{formatDate(vehicle.taxExpiryDate)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-300 mb-4">
            <span>{vehicle.year}</span>
            <span>{vehicle.fuelType}</span>
            <span>{vehicle.mileage.toLocaleString()} miles</span>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              onClick={onDetailsClick}
            >
              <Info size={16} className="mr-2" /> Details
            </Button>
            <Button 
              className="flex-1 bg-primary text-white hover:bg-primary/90"
              onClick={onServiceClick}
            >
              <Settings size={16} className="mr-2" /> Service
            </Button>
          </div>
        </>
      )}
      
      {!showDetails && (
        <Link to={`/vehicles/${vehicle.registration.replace(/\s+/g, '')}`} className="block mt-2">
          <Button variant="link" className="text-primary p-0 h-auto">
            View details
          </Button>
        </Link>
      )}
    </div>
  );
};

export default VehicleCard;
