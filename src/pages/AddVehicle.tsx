
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "../contexts/VehicleContext";
import NavBar from "../components/NavBar";
import { ArrowLeft } from "lucide-react";
import DvlaApiKeyDialog from "../components/vehicle/DvlaApiKeyDialog";
import VehicleRegistrationForm from "../components/vehicle/VehicleRegistrationForm";
import { toast } from "sonner";
import BackgroundWrapper from "../components/dashboard/BackgroundWrapper";

const AddVehicle = () => {
  const [searchStep, setSearchStep] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  
  const { fetchVehicleData } = useVehicles();
  const navigate = useNavigate();

  const handleSearch = async (registration: string) => {
    if (!registration.trim()) {
      setError("Please enter a registration number");
      return;
    }
    
    setSearching(true);
    setError(null);
    
    try {
      console.log(`Searching for vehicle with registration: ${registration}`);
      const vehicleData = await fetchVehicleData(registration);
      
      if (vehicleData) {
        toast.success(`Found vehicle: ${vehicleData.make} ${vehicleData.model || ''}`);
        navigate(`/vehicles/${vehicleData.id}`);
      } else {
        setError("Could not find vehicle details. Please check the registration number.");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err?.message || "An error occurred while searching for the vehicle");
    } finally {
      setSearching(false);
    }
  };

  return (
    <BackgroundWrapper>
      <div className="gm-page-container">
        <header className="gm-page-header">
          <div className="flex items-center w-full justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="gm-back-button"
            >
              <ArrowLeft size={24} />
            </button>
            
            <h1 className="gm-header-title">Add Vehicle</h1>
            
            {/* Empty div to balance the layout */}
            <div className="w-10"></div>
          </div>
          
          <DvlaApiKeyDialog 
            dialogOpen={apiKeyDialogOpen} 
            setDialogOpen={setApiKeyDialogOpen} 
          />
        </header>

        <div className="gm-page-content px-4 py-6">
          {searchStep ? (
            <VehicleRegistrationForm 
              onSearch={handleSearch} 
              searching={searching} 
              error={error} 
            />
          ) : (
            <div>
              {/* Vehicle details form would go here */}
            </div>
          )}
        </div>

        <NavBar />
      </div>
    </BackgroundWrapper>
  );
};

export default AddVehicle;
