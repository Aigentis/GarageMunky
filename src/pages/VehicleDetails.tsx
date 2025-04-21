
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVehicles } from "../contexts/VehicleContext";
import NavBar from "../components/NavBar";
import VehicleDetailsList from "../components/VehicleDetailsList";
import { ArrowLeft, MoreVertical } from "lucide-react";

const VehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { getVehicleById } = useVehicles();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(id ? getVehicleById(id) : undefined);

  useEffect(() => {
    if (id) {
      const vehicleData = getVehicleById(id);
      setVehicle(vehicleData);
      
      if (!vehicleData) {
        // Redirect if vehicle not found
        navigate("/vehicles", { replace: true });
      }
    }
  }, [id, getVehicleById, navigate]);

  if (!vehicle) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 border-4 border-t-primary border-r-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading vehicle...</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-white p-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
          
          <h1 className="text-lg font-bold">Detail Car</h1>
          
          <button className="w-10 h-10 flex items-center justify-center">
            <MoreVertical size={24} />
          </button>
        </div>
      </header>
      
      <div className="px-4 py-2">
        <h2 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h2>
        <p className="text-gray-600 text-sm">
          The {vehicle.make} {vehicle.model} combines cutting-edge {vehicle.fuelType.toLowerCase()} performance with sleek design.
        </p>
      </div>
      
      {/* Vehicle Image */}
      {vehicle.image && (
        <div className="px-4 py-2">
          <div className="h-60 overflow-hidden rounded-xl">
            <img 
              src={vehicle.image} 
              alt={`${vehicle.make} ${vehicle.model}`} 
              className="w-full object-cover" 
            />
          </div>
        </div>
      )}
      
      {/* Vehicle Specs */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {vehicle.specs?.power && (
            <div className="flex items-center p-3 border border-gray-100 rounded-lg">
              <div className="rounded-full bg-gray-100 p-2 mr-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m13 2-2 2.5h3L12 8" />
                  <path d="M19 15c1.1-1.76 2-3.83 2-6a9 9 0 0 0-9-9 8.93 8.93 0 0 0-4 1" />
                  <path d="M3 15c-1.1-1.76-2-3.83-2-6a9 9 0 0 1 9-9 8.93 8.93 0 0 1 4 1" />
                  <path d="m12 22 5-5" />
                  <path d="m9 13-2.47-.62a1 1 0 0 1-.58-1.53l4.58-6.08" />
                  <path d="m16.74 13.77.76-3.04a1 1 0 0 0-.71-1.22l-3.76-.94" />
                  <path d="M12 22v-4" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Top Speed</div>
                <div className="font-medium">{vehicle.specs.power}</div>
              </div>
            </div>
          )}
          
          {vehicle.specs?.consumption && (
            <div className="flex items-center p-3 border border-gray-100 rounded-lg">
              <div className="rounded-full bg-gray-100 p-2 mr-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
                  <path d="M18 18a3 3 0 1 0 3 3c0-1-.8-2-2.1-1.8-.9.1-1.1-.1-1.5-.6l-.4-.5M9 18h.01M12 18h.01" />
                  <path d="M16 6H8a1 1 0 0 0-1 1v1c0 2 .5 3 2 3h6c1.5 0 2-1 2-3V7a1 1 0 0 0-1-1Z" />
                  <path d="M18 18a3 3 0 1 0 0-6M15.3 18a3 3 0 1 0 0-6" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Consumption</div>
                <div className="font-medium">{vehicle.specs.consumption}</div>
              </div>
            </div>
          )}
          
          {vehicle.specs?.capacity && (
            <div className="flex items-center p-3 border border-gray-100 rounded-lg">
              <div className="rounded-full bg-gray-100 p-2 mr-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2Z" />
                  <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
                  <path d="M10 16v-3" />
                  <path d="M2 8h20" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Capacity</div>
                <div className="font-medium">{vehicle.specs.capacity}</div>
              </div>
            </div>
          )}
          
          {vehicle.specs?.seats && (
            <div className="flex items-center p-3 border border-gray-100 rounded-lg">
              <div className="rounded-full bg-gray-100 p-2 mr-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V7Z" />
                  <path d="M9 17h6" />
                  <path d="M9 13h6" />
                  <path d="M9 9h1" />
                  <path d="M13 9h2" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Seats</div>
                <div className="font-medium">{vehicle.specs.seats} adults</div>
              </div>
            </div>
          )}
        </div>
        
        {vehicle.specs?.features && vehicle.specs.features.length > 0 && (
          <div className="mt-4">
            {vehicle.specs.features.map((feature, index) => (
              <div key={index} className="flex items-center py-2">
                <div className="rounded-full bg-primary/10 p-1 mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="m9 11 3 3L22 4" />
                  </svg>
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Owner Information (for demo) */}
      <div className="px-4 py-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
              <img 
                src="https://randomuser.me/api/portraits/men/92.jpg" 
                alt="Alex Johnson"
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h3 className="font-medium">Alex Johnson</h3>
              <div className="flex items-center text-sm text-gray-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="ml-1">Downtown Avenue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Vehicle Details */}
      <div className="px-4 py-4">
        <VehicleDetailsList vehicle={vehicle} />
      </div>
      
      {/* Book Service Button */}
      <div className="px-4 py-4">
        <button className="gm-btn-primary">
          Book Service Now
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <NavBar />
    </div>
  );
};

export default VehicleDetails;
