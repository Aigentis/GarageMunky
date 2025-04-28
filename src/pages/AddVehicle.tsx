
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "../contexts/VehicleContext";
import { useUser } from "../contexts/UserContext";
import NavBar from "../components/NavBar";
import { ArrowLeft } from "lucide-react";
import VehicleRegistrationForm from "../components/vehicle/VehicleRegistrationForm";
import VehicleDataEditForm from "../components/vehicle/VehicleDataEditForm";
import { toast } from "sonner";
import BackgroundWrapper from "../components/dashboard/BackgroundWrapper";
import { Vehicle } from "../types";

const AddVehicle = () => {
  // Step management: 1 = registration entry, 2 = edit vehicle data, 3 = confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleData, setVehicleData] = useState<Vehicle | null>(null);
  
  const { fetchVehicleData, updateVehicle } = useVehicles();
  const { user } = useUser();
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
      const result = await fetchVehicleData(registration);
      
      if (result) {
        // Found vehicle data, move to the edit step
        setVehicleData(result);
        setCurrentStep(2);
        toast.success(`Found vehicle details for ${registration}`);
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

  const handleSaveVehicle = async (vehicle: Vehicle) => {
    if (!user) {
      toast.error("You must be logged in to save a vehicle");
      return;
    }
    
    setSaving(true);
    
    try {
      // Ensure the vehicle has the current user's ID
      const updatedVehicle = {
        ...vehicle,
        ownerId: user.id
      };
      
      // Update the vehicle in the context
      updateVehicle(updatedVehicle);
      
      toast.success(`${updatedVehicle.make} ${updatedVehicle.model} added to your garage`);
      
      // Navigate to the vehicle details page
      navigate(`/vehicles/${updatedVehicle.registration.replace(/\s+/g, '')}`);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Failed to save vehicle. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setVehicleData(null);
    setError(null);
  };

  return (
    <BackgroundWrapper>
      <div className="gm-page-container">
        <header className="gm-page-header">
          <div className="flex items-center w-full justify-between">
            <button 
              onClick={() => currentStep === 1 ? navigate(-1) : handleBack()}
              className="gm-back-button"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            
            <h1 className="gm-header-title">
              {currentStep === 1 ? "Add Vehicle" : "Edit Vehicle Details"}
            </h1>
            
            {/* Empty div to balance the layout */}
            <div className="w-10"></div>
          </div>
        </header>

        <div className="gm-page-content px-4 py-6">
          {currentStep === 1 ? (
            <VehicleRegistrationForm 
              onSearch={handleSearch} 
              searching={searching} 
              error={error} 
            />
          ) : vehicleData ? (
            <VehicleDataEditForm
              vehicleData={vehicleData}
              onSave={handleSaveVehicle}
              onCancel={handleBack}
              saving={saving}
            />
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-gray-500">Loading vehicle data...</p>
            </div>
          )}
        </div>

        <NavBar />
      </div>
    </BackgroundWrapper>
  );
};

export default AddVehicle;
