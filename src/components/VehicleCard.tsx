
import { Vehicle } from "../types";
import { Calendar, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface VehicleCardProps {
  vehicle: Vehicle;
  showDetails?: boolean;
}

const VehicleCard = ({ vehicle, showDetails = true }: VehicleCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "expired":
        return "text-red-600 bg-red-50";
      case "expiring_soon":
        return "text-amber-600 bg-amber-50";
      case "valid":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
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
    <div className="bg-white rounded-2xl shadow-sm p-4 overflow-hidden border border-gray-100">
      <Link to={`/vehicles/${vehicle.id}`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg text-black">{vehicle.make} {vehicle.model}</h3>
          <span className="text-sm bg-gray-100 rounded-full px-3 py-1">
            {vehicle.registration}
          </span>
        </div>

        {vehicle.image && (
          <div className="relative h-40 mb-3 rounded-lg overflow-hidden">
            <img 
              src={vehicle.image} 
              alt={`${vehicle.make} ${vehicle.model}`} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {showDetails && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className={`p-2 rounded-lg flex items-center ${motStatusClass}`}>
                <div className="mr-2">
                  {vehicle.motStatus === 'valid' ? (
                    <Calendar size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                </div>
                <div>
                  <p className="text-xs">MOT</p>
                  <p className="text-sm font-medium">{formatDate(vehicle.motExpiryDate)}</p>
                </div>
              </div>
              
              <div className={`p-2 rounded-lg flex items-center ${taxStatusClass}`}>
                <div className="mr-2">
                  {vehicle.taxStatus === 'valid' ? (
                    <Calendar size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                </div>
                <div>
                  <p className="text-xs">Road Tax</p>
                  <p className="text-sm font-medium">{formatDate(vehicle.taxExpiryDate)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>{vehicle.year}</span>
              <span>{vehicle.fuelType}</span>
              <span>{vehicle.mileage.toLocaleString()} miles</span>
            </div>
          </>
        )}
      </Link>
    </div>
  );
};

export default VehicleCard;
