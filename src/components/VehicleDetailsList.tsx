
import { Vehicle } from "../types";

interface VehicleDetailsListProps {
  vehicle: Vehicle;
}

const VehicleDetailsList = ({ vehicle }: VehicleDetailsListProps) => {
  const stats = [
    { label: "Registration", value: vehicle.registration },
    { label: "Make", value: vehicle.make },
    { label: "Model", value: vehicle.model },
    { label: "Year", value: vehicle.year.toString() },
    { label: "Color", value: vehicle.color },
    { label: "Fuel Type", value: vehicle.fuelType },
    { label: "Mileage", value: `${vehicle.mileage.toLocaleString()} miles` },
    { 
      label: "MOT Expiry", 
      value: new Date(vehicle.motExpiryDate).toLocaleDateString("en-GB"),
      status: vehicle.motStatus
    },
    { 
      label: "Tax Expiry", 
      value: new Date(vehicle.taxExpiryDate).toLocaleDateString("en-GB"),
      status: vehicle.taxStatus
    }
  ];

  const getStatusColor = (status?: string) => {
    if (!status) return "";
    
    switch (status) {
      case "expired":
        return "text-red-600";
      case "expiring_soon":
        return "text-amber-600";
      case "valid":
        return "text-green-600";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Vehicle Details</h3>
      <div className="divide-y divide-gray-100">
        {stats.map((stat, index) => (
          <div key={index} className="py-3 flex justify-between">
            <span className="text-gray-600">{stat.label}</span>
            <span className={`font-medium ${getStatusColor(stat.status)}`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleDetailsList;
