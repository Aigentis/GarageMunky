import { useState } from 'react';
import { Vehicle } from '../../types';
import { Button } from "@/components/ui/button";
import { Loader, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getMotStatusDescription, getTaxStatusDescription } from "../../services/dvlaService";

interface VehicleDataEditFormProps {
  vehicleData: Vehicle;
  onSave: (vehicle: Vehicle) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

// List of common vehicle makes for the dropdown
const commonMakes = [
  "Audi", "BMW", "Citroen", "Dacia", "Fiat", "Ford", "Honda", "Hyundai", 
  "Jaguar", "Kia", "Land Rover", "Lexus", "Mazda", "Mercedes-Benz", 
  "Mini", "Mitsubishi", "Nissan", "Peugeot", "Renault", "Seat", 
  "Skoda", "Suzuki", "Tesla", "Toyota", "Vauxhall", "Volkswagen", "Volvo"
];

// List of common fuel types
const fuelTypes = [
  "Petrol", "Diesel", "Hybrid", "Electric", "LPG", "Other"
];

// List of common colors
const colors = [
  "Black", "Blue", "Brown", "Gold", "Green", "Grey", "Orange", 
  "Purple", "Red", "Silver", "White", "Yellow", "Other"
];

const VehicleDataEditForm: React.FC<VehicleDataEditFormProps> = ({
  vehicleData,
  onSave,
  onCancel,
  saving
}) => {
  const [vehicle, setVehicle] = useState<Vehicle>(vehicleData);
  const [customMake, setCustomMake] = useState<string>("");
  const [customColor, setCustomColor] = useState<string>("");
  const [customFuelType, setCustomFuelType] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setVehicle(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'mileage' ? parseInt(value) || 0 : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const errors: {[key: string]: string} = {};
    if (!vehicle.make) errors.make = "Make is required";
    if (!vehicle.model) errors.model = "Model is required";
    if (!vehicle.year) errors.year = "Year is required";
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Apply any custom values
    const updatedVehicle = {
      ...vehicle,
      make: vehicle.make === 'Other' ? customMake : vehicle.make,
      color: vehicle.color === 'Other' ? customColor : vehicle.color,
      fuelType: vehicle.fuelType === 'Other' ? customFuelType : vehicle.fuelType
    };
    
    try {
      await onSave(updatedVehicle);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Failed to save vehicle. Please try again.");
    }
  };
  
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-black">Edit Vehicle Details</h1>
        <p className="text-gray-600 mt-1">
          Review and edit your vehicle information
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* MOT and Tax Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* MOT Status Card */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">MOT Status</h3>
              {vehicle.motStatus === 'valid' ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : vehicle.motStatus === 'expiring_soon' ? (
                <AlertCircle className="text-amber-500" size={20} />
              ) : (
                <AlertCircle className="text-red-500" size={20} />
              )}
            </div>
            <div className={`text-sm mt-1 ${vehicle.motStatus === 'valid' ? 'text-green-600' : vehicle.motStatus === 'expiring_soon' ? 'text-amber-600' : 'text-red-600'}`}>
              {getMotStatusDescription(vehicle.motStatus, vehicle.motExpiryDate)}
            </div>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <Calendar size={14} className="mr-1" />
              {vehicle.motExpiryDate ? new Date(vehicle.motExpiryDate).toLocaleDateString() : 'Not available'}
            </div>
          </div>
          
          {/* Tax Status Card */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Road Tax</h3>
              {vehicle.taxStatus === 'valid' ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : vehicle.taxStatus === 'expiring_soon' ? (
                <AlertCircle className="text-amber-500" size={20} />
              ) : (
                <AlertCircle className="text-red-500" size={20} />
              )}
            </div>
            <div className={`text-sm mt-1 ${vehicle.taxStatus === 'valid' ? 'text-green-600' : vehicle.taxStatus === 'expiring_soon' ? 'text-amber-600' : 'text-red-600'}`}>
              {getTaxStatusDescription(vehicle.taxStatus, vehicle.taxExpiryDate)}
            </div>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <Calendar size={14} className="mr-1" />
              {vehicle.taxExpiryDate ? new Date(vehicle.taxExpiryDate).toLocaleDateString() : 'Not available'}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="text-lg font-semibold mb-3">Registration: {vehicle.registration}</div>
          
          {/* Make */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make*
            </label>
            <select
              name="make"
              value={commonMakes.includes(vehicle.make) ? vehicle.make : 'Other'}
              onChange={handleChange}
              className={`w-full border ${validationErrors.make ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2`}
              required
            >
              {commonMakes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            
            {vehicle.make === 'Other' && (
              <input
                type="text"
                value={customMake}
                onChange={(e) => setCustomMake(e.target.value)}
                placeholder="Enter make"
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            )}
            
            {validationErrors.make && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.make}</p>
            )}
          </div>
          
          {/* Model */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model*
            </label>
            <input
              type="text"
              name="model"
              value={vehicle.model}
              onChange={handleChange}
              placeholder="e.g. Focus, Golf, Civic"
              className={`w-full border ${validationErrors.model ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2`}
              required
            />
            {validationErrors.model && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.model}</p>
            )}
          </div>
          
          {/* Year */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year*
            </label>
            <select
              name="year"
              value={vehicle.year}
              onChange={handleChange}
              className={`w-full border ${validationErrors.year ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2`}
              required
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {validationErrors.year && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.year}</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Additional Details</h2>
          
          {/* Color */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colour
            </label>
            <select
              name="color"
              value={colors.includes(vehicle.color) ? vehicle.color : 'Other'}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            
            {vehicle.color === 'Other' && (
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="Enter color"
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2"
              />
            )}
          </div>
          
          {/* Fuel Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Type
            </label>
            <select
              name="fuelType"
              value={fuelTypes.includes(vehicle.fuelType) ? vehicle.fuelType : 'Other'}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {fuelTypes.map(fuelType => (
                <option key={fuelType} value={fuelType}>{fuelType}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            
            {vehicle.fuelType === 'Other' && (
              <input
                type="text"
                value={customFuelType}
                onChange={(e) => setCustomFuelType(e.target.value)}
                placeholder="Enter fuel type"
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2"
              />
            )}
          </div>
          
          {/* Engine Capacity - Read only from DVLA data */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Engine Capacity
            </label>
            <input
              type="text"
              name="engineCapacity"
              value={vehicle.specs?.capacity || 'Available with premium'}
              readOnly
              className="w-full border bg-gray-50 border-gray-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Full engine specifications available with premium</p>
          </div>
          
          {/* Mileage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Mileage
            </label>
            <input
              type="number"
              name="mileage"
              value={vehicle.mileage || ''}
              onChange={handleChange}
              placeholder="e.g. 45000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
            disabled={saving}
          >
            Back
          </Button>
          
          <Button
            type="submit"
            className="flex-1 bg-primary text-white"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader size={20} className="animate-spin mr-2" />
                Saving...
              </>
            ) : "Save Vehicle"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VehicleDataEditForm;
