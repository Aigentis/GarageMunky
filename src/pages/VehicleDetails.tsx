// src/pages/VehicleDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVehicles } from '../contexts/VehicleContext';
import NavBar from '../components/NavBar';
import DiagnosticsPanel from '../components/diagnostics/DiagnosticsPanel';
import { Vehicle } from '../types';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { getTaxStatusDescription, getMotStatusDescription } from '../services/dvlaService';
import BackgroundWrapper from '../components/dashboard/BackgroundWrapper';
import EditVehicleDetailsForm from '../components/vehicle/EditVehicleDetailsForm';
import DeleteVehicleButton from '../components/vehicle/DeleteVehicleButton';
import PremiumVehicleData from '../components/vehicle/PremiumVehicleData';
import { toast } from 'sonner';

const VehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { vehicles, getVehicle, getVehicleByRegistration, updateVehicle } = useVehicles();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'services'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  // For demo purposes, set isPremiumUser to false by default
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (id) {
      // First try to find by registration (new URL format)
      let foundVehicle = getVehicleByRegistration(id);
      
      // If not found by registration, fall back to ID lookup (for backward compatibility)
      if (!foundVehicle) {
        foundVehicle = getVehicle(id);
      }
      
      if (foundVehicle) {
        setVehicle(foundVehicle);
        
        // Update URL to use registration if it's not already using it
        // This helps migrate old URLs to the new format
        const cleanedReg = foundVehicle.registration.replace(/\s+/g, '');
        if (id !== cleanedReg) {
          navigate(`/vehicles/${cleanedReg}`, { replace: true });
        }
      } else {
        // Vehicle not found, redirect to vehicles page
        navigate('/vehicles');
      }
    }
  }, [id, vehicles, getVehicle, getVehicleByRegistration, navigate]);
  
  if (!vehicle) {
    return <div className="p-4">Loading vehicle details...</div>;
  }
  
  return (
    <BackgroundWrapper>
      <div className="gm-page-container">
        <header className="gm-page-header">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="gm-back-button"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            
            <h1 className="gm-header-title">{vehicle.make} {vehicle.model}</h1>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowEditModal(true)}
                className="gm-back-button"
                aria-label="Edit vehicle"
              >
                <Edit2 size={20} />
              </button>
              
              <DeleteVehicleButton vehicleId={vehicle.id} />
            </div>
          </div>
        </header>
        
        <div className="gm-page-content px-4 py-6">
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'diagnostics' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('diagnostics')}
            >
              Diagnostics
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'services' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('services')}
            >
              Services
            </button>
          </div>
          
          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold">{vehicle.registration}</div>
                <div className="text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                <div className="text-gray-600">{vehicle.color} • {vehicle.fuelType}</div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">MOT Status</div>
                    <div className={`font-medium ${vehicle.motStatus === 'valid' ? 'text-green-600' : vehicle.motStatus === 'expiring_soon' ? 'text-amber-600' : 'text-red-600'}`}>
                      {getMotStatusDescription(vehicle.motStatus, vehicle.motExpiryDate)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Road Tax</div>
                    <div className={`font-medium ${vehicle.taxStatus === 'valid' ? 'text-green-600' : vehicle.taxStatus === 'expiring_soon' ? 'text-amber-600' : 'text-red-600'}`}>
                      {getTaxStatusDescription(vehicle.taxStatus, vehicle.taxExpiryDate)}
                    </div>
                  </div>
                </div>
                
                {vehicle.mileage > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-500">Mileage</div>
                    <div>{vehicle.mileage.toLocaleString()} miles</div>
                  </div>
                )}
              </div>
              
              {vehicle.specs && Object.keys(vehicle.specs).length > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-2">Vehicle Specifications</h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    {Object.entries(vehicle.specs).map(([key, value]) => 
                      value ? (
                        <div key={key}>
                          <div className="text-sm text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                          <div>{value}</div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
              
              {/* Premium Vehicle Data Section */}
              <PremiumVehicleData 
                vehicle={vehicle} 
                isPremiumUser={isPremiumUser} 
                onVehicleDataEnhanced={(enhancedVehicle) => {
                  setVehicle(enhancedVehicle);
                  updateVehicle(enhancedVehicle);
                }}
              />
              
            </div>
          )}
          
          {activeTab === 'diagnostics' && (
            <DiagnosticsPanel vehicle={vehicle} />
          )}
          
          {activeTab === 'services' && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Service History</h3>
              <p className="text-gray-500">No service history available for this vehicle.</p>
              {/* Service history would go here */}
            </div>
          )}
        </div>
        
        <NavBar />
      </div>
      
      {/* Edit Vehicle Modal */}
      {showEditModal && vehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <EditVehicleDetailsForm 
              vehicle={vehicle} 
              onClose={() => setShowEditModal(false)}
              onSave={(updatedVehicle) => {
                updateVehicle(updatedVehicle);
                setVehicle(updatedVehicle);
                toast.success('Vehicle details updated successfully');
                setShowEditModal(false);
              }}
            />
          </div>
        </div>
      )}
    </BackgroundWrapper>
  );
};

export default VehicleDetails;
