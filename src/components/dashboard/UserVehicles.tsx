
import { Link } from "react-router-dom";
import { Vehicle } from "../../types";
import { getTaxStatusDescription, getMotStatusDescription } from "../../services/dvlaService";

interface UserVehiclesProps {
  loading: boolean;
  vehicles: Vehicle[];
}

const UserVehicles = ({ loading, vehicles }: UserVehiclesProps) => {
  // Function to get vehicle image based on make
  const getVehicleImage = (vehicle: Vehicle) => {
    const make = vehicle.make.toLowerCase();
    if (make.includes('range') || make.includes('land rover')) {
      return "/lovable-uploads/e3cede36-07a4-4a16-b5bf-f6e7285c65ad.png";
    } else if (make.includes('bmw')) {
      return "/vehicle-images/bmw.jpg";
    } else if (make.includes('audi')) {
      return "/vehicle-images/audi.jpg";
    } else if (make.includes('mercedes')) {
      return "/vehicle-images/mercedes.jpg";
    } else if (make.includes('ford')) {
      return "/vehicle-images/ford.jpg";
    } else if (make.includes('toyota')) {
      return "/vehicle-images/toyota.jpg";
    } else {
      return "/placeholder.svg";
    }
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to check if MOT or tax is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-black">Your Vehicles</h2>
        <Link to="/vehicles" className="text-primary text-xs font-medium">
          See All
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">You don't have any vehicles yet.</p>
          <Link to="/vehicles/add" className="mt-3 inline-block text-primary font-medium">
            Add a Vehicle
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} to={`/vehicles/${vehicle.registration.replace(/\s+/g, '')}`} className="block">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-36 bg-gray-100 relative">
                  <img 
                    src={getVehicleImage(vehicle)} 
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col space-y-2">
                    <div className={`rounded-full px-2 py-1 text-xs flex items-center ${getStatusColor(vehicle.motStatus)}`}>
                      <span>MOT: {getMotStatusDescription(vehicle.motStatus)}</span>
                    </div>
                    <div className={`rounded-full px-2 py-1 text-xs flex items-center ${getStatusColor(vehicle.taxStatus)}`}>
                      <span>Tax: {getTaxStatusDescription(vehicle.taxStatus)}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full flex items-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    </svg>
                    <span className="ml-1">{vehicle.registration}</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-black">{vehicle.make} {vehicle.model}</h3>
                  <div className="flex justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      <span>{vehicle.year} • {vehicle.fuelType}</span>
                    </div>
                    {isExpiringSoon(vehicle.motExpiryDate) && (
                      <div className="text-xs text-amber-600 font-medium">
                        MOT expires soon
                      </div>
                    )}
                    {isExpiringSoon(vehicle.taxExpiryDate) && (
                      <div className="text-xs text-amber-600 font-medium">
                        Tax expires soon
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserVehicles;
