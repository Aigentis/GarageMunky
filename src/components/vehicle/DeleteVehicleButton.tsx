import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useVehicles } from '../../contexts/VehicleContext';
import { toast } from 'sonner';

interface DeleteVehicleButtonProps {
  vehicleId: string;
  className?: string;
  onDelete?: () => void;
}

const DeleteVehicleButton = ({ vehicleId, className = '', onDelete }: DeleteVehicleButtonProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { deleteVehicle } = useVehicles();
  const navigate = useNavigate();

  const handleDelete = () => {
    try {
      const success = deleteVehicle(vehicleId);
      
      if (success) {
        toast.success('Vehicle deleted successfully');
        
        // If onDelete callback is provided, call it
        if (onDelete) {
          onDelete();
        } else {
          // Otherwise navigate to the vehicles list
          navigate('/vehicles');
        }
      } else {
        toast.error('Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('An error occurred while deleting the vehicle');
    } finally {
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        className={`flex items-center justify-center p-2 text-red-500 hover:text-red-700 ${className}`}
        aria-label="Delete vehicle"
      >
        <Trash2 size={20} />
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteVehicleButton;
