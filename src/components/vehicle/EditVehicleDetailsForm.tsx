import { useState } from 'react';
import { Vehicle } from '../../types';
import { useVehicles } from '../../contexts/VehicleContext';
import { toast } from 'sonner';

interface EditVehicleDetailsFormProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (updatedVehicle: Vehicle) => void;
}

const EditVehicleDetailsForm = ({ vehicle, onClose, onSave }: EditVehicleDetailsFormProps) => {
  const [formData, setFormData] = useState({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    fuelType: vehicle.fuelType,
    mileage: vehicle.mileage,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'mileage' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create updated vehicle object
      const updatedVehicle: Vehicle = {
        ...vehicle,
        ...formData,
      };

      // Call the onSave callback with the updated vehicle
      onSave(updatedVehicle);
      
      toast.success('Vehicle details updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error('Failed to update vehicle details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Edit Vehicle Details</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make
            </label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min={1900}
                max={new Date().getFullYear() + 1}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type
              </label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="LPG">LPG</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mileage
              </label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                min={0}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditVehicleDetailsForm;
