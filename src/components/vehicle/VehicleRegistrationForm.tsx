
import React, { useState } from "react";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRegistration, cleanRegistrationForApi } from "../../utils/vehicleUtils";
import UKNumberPlate from "./UKNumberPlate";

interface VehicleRegistrationFormProps {
  onSearch: (registration: string) => Promise<void>;
  searching: boolean;
  error: string | null;
}

const VehicleRegistrationForm: React.FC<VehicleRegistrationFormProps> = ({
  onSearch,
  searching,
  error
}) => {
  const [registration, setRegistration] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registration.trim()) {
      // Use the clean registration for the API call
      onSearch(registration);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mt-4 text-black">Enter Your Vehicle Details</h1>
        <p className="text-gray-600 mt-2">
          Please enter your vehicle's registration number to continue
        </p>
      </div>

      <div className="max-w-sm mx-auto p-6 bg-black/5 rounded-3xl">
        <UKNumberPlate registrationNumber={registration || "AB12 CDE"} className="mb-6" />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number
            </label>
            <input 
              type="text" 
              value={registration} 
              onChange={e => setRegistration(formatRegistration(e.target.value))} 
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-lg text-center font-medium uppercase tracking-wider"
              placeholder="ENTER REGISTRATION" 
              maxLength={8} 
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={searching || !registration.trim()} 
            className="w-full bg-primary text-black font-bold py-4 rounded-lg"
          >
            {searching ? (
              <>
                <Loader size={20} className="animate-spin mr-2" />
                Searching...
              </>
            ) : "Next"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VehicleRegistrationForm;
