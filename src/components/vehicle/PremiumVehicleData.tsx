import { useState } from 'react';
import { Vehicle } from '../../types';
import { enhanceVehicleData } from '../../services/checkCarDetailsService';
import { Button } from '@/components/ui/button';
import { Loader, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface PremiumVehicleDataProps {
  vehicle: Vehicle;
  isPremiumUser: boolean;
  onVehicleDataEnhanced?: (enhancedVehicle: Vehicle) => void;
}

const PremiumVehicleData = ({ vehicle, isPremiumUser, onVehicleDataEnhanced }: PremiumVehicleDataProps) => {
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleGetPremiumData = async () => {
    if (!isPremiumUser) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const enhancedVehicle = await enhanceVehicleData(vehicle);
      if (onVehicleDataEnhanced) {
        onVehicleDataEnhanced(enhancedVehicle);
      }
      toast.success('Vehicle data enhanced with premium features');
    } catch (error) {
      console.error('Error enhancing vehicle data:', error);
      toast.error('Failed to get premium vehicle data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Premium Vehicle Data</h3>
          <div className="flex items-center text-amber-500">
            <Lock size={16} className="mr-1" />
            <span className="text-xs font-medium">Premium</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Unlock additional vehicle details including specifications, mileage history, and vehicle images with our premium service.
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-500">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 mr-2">✓</span>
            <span className="text-sm">Full Vehicle Specifications</span>
          </div>
          <div className="flex items-center text-gray-500">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 mr-2">✓</span>
            <span className="text-sm">Vehicle Images</span>
          </div>
          <div className="flex items-center text-gray-500">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 mr-2">✓</span>
            <span className="text-sm">Mileage History</span>
          </div>
          <div className="flex items-center text-gray-500">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 mr-2">✓</span>
            <span className="text-sm">Car History Check (£3.00)</span>
          </div>
        </div>

        <Button
          onClick={handleGetPremiumData}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader size={16} className="animate-spin mr-2" />
              Loading premium data...
            </>
          ) : isPremiumUser ? (
            'Get Premium Vehicle Data'
          ) : (
            'Upgrade to Premium'
          )}
        </Button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Upgrade to Premium</h3>
            <p className="text-gray-600 mb-6">
              Get access to premium vehicle data including full specifications, mileage history, and vehicle images for just £4.99/month.
            </p>
            <div className="space-y-4">
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                Subscribe Now - £4.99/month
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowUpgradeModal(false)}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumVehicleData;
