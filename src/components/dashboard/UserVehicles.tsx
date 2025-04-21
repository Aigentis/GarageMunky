
import { Link } from "react-router-dom";
import { Vehicle } from "../../types";

interface UserVehiclesProps {
  loading: boolean;
  vehicles: Vehicle[];
}

const UserVehicles = ({ loading, vehicles }: UserVehiclesProps) => {
  // For demo purposes, we'll use these placeholders matching the mockup
  const mockVehicles = [
    {
      id: "1",
      name: "Range Rover Sport",
      location: "Biscayne Boulevard",
      speed: "250 km/h",
      consumption: "8.9 L"
    },
    {
      id: "2",
      name: "Chevrolet Tahoe",
      location: "Margaret Pace Park",
      speed: "220 km/h",
      consumption: "7 L"
    }
  ];

  return (
    <div className="px-4 pt-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-black">Nearby You</h2>
        <Link to="/vehicles" className="text-primary text-xs font-medium">
          See All
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading vehicles...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mockVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="h-36 bg-gray-100 relative">
                <img 
                  src={vehicle.id === "1" ? "/lovable-uploads/e3cede36-07a4-4a16-b5bf-f6e7285c65ad.png" : "/placeholder.svg"} 
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex flex-col space-y-2">
                  <div className="bg-white rounded-full px-2 py-1 text-xs flex items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m15 12-3-3-3 3 3 3 3-3Z" />
                    </svg>
                    <span className="ml-1">{vehicle.speed}</span>
                  </div>
                  <div className="bg-white rounded-full px-2 py-1 text-xs flex items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m18 14-6-6-6 6" />
                    </svg>
                    <span className="ml-1">{vehicle.consumption}</span>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full flex items-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="ml-1">{vehicle.location}</span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-black">{vehicle.name}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserVehicles;
