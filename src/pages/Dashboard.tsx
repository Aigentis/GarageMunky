import React, { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useVehicles } from '../contexts/VehicleContext';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import VehicleCard from '../components/VehicleCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import QuickActions from "../components/dashboard/QuickActions";
import UserVehicles from "../components/dashboard/UserVehicles";
import NearbyGarages from "../components/dashboard/NearbyGarages";
import AlertNotifications from "../components/dashboard/AlertNotifications";
import NavBar from "../components/NavBar";
import { Models } from 'appwrite';

// Define interfaces for user types to fix TypeScript errors
interface LegacyUser {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  location?: string;
  role?: string;
}

// Appwrite user interface matching the one in AuthContext
interface AppwriteUser {
  $id: string;
  name: string;
  email: string;
  role?: UserRole;
  profile?: {
    avatar?: string;
    location?: string;
  };
}

const Dashboard = () => {
  const { user: legacyUser } = useUser();
  const { user } = useAuth();
  // Cast the user to our AppwriteUser type
  const appwriteUser = user as AppwriteUser;
  const { userVehicles, loading } = useVehicles();
  const [greeting, setGreeting] = useState<string>("Morning");
  const [hasExpiringMOT, setHasExpiringMOT] = useState<boolean>(false);
  const [hasExpiringTax, setHasExpiringTax] = useState<boolean>(false);

  // Combine user data from both contexts
  const combinedUser = appwriteUser ? {
    id: appwriteUser.$id,
    name: appwriteUser.name || legacyUser?.name,
    email: appwriteUser.email || legacyUser?.email,
    avatar: appwriteUser.profile?.avatar || legacyUser?.avatar,
    location: appwriteUser.profile?.location || legacyUser?.location || 'Greenwood Drive, Miami',
    role: appwriteUser.role || legacyUser?.role
  } : legacyUser || {};

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Morning");
    else if (hour < 18) setGreeting("Afternoon");
    else setGreeting("Evening");

    // Check for expiring MOT and tax
    if (userVehicles.length > 0) {
      // Check if any vehicle has MOT expiring in the next 30 days
      const hasExpiringMOT = userVehicles.some(vehicle => {
        if (!vehicle.motExpiryDate) return false;
        const motExpiry = new Date(vehicle.motExpiryDate);
        const today = new Date();
        const diffTime = motExpiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
      });
      
      // Check if any vehicle has tax expiring in the next 30 days
      const hasExpiringTax = userVehicles.some(vehicle => {
        if (!vehicle.taxExpiryDate) return false;
        const taxExpiry = new Date(vehicle.taxExpiryDate);
        const today = new Date();
        const diffTime = taxExpiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
      });
      
      setHasExpiringMOT(hasExpiringMOT);
      setHasExpiringTax(hasExpiringTax);
    }
  }, [userVehicles]);

  // Format user name for greeting
  const firstName = combinedUser?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 flex flex-col relative">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/lovable-uploads/0337f69d-c2bf-4fd7-8b4b-3a1f0b252d56.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        ></div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="container mx-auto px-4 py-6">
            <DashboardHeader 
              userName={firstName} 
              userLocation={combinedUser?.location || 'Unknown Location'} 
            />
          </div>

          <div className="px-4 py-6 flex-1">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Your Vehicles</h2>
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userVehicles && userVehicles.length > 0 ? (
                <div className="space-y-4">
                  {userVehicles.map((vehicle) => (
                    <VehicleCard 
                      key={vehicle.id} 
                      vehicle={vehicle} 
                      onServiceClick={() => toast.info("Service booking", { description: "This feature is coming soon!" })}
                      onDetailsClick={() => toast.info("Vehicle details", { description: "This feature is coming soon!" })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-black/50 rounded-xl border border-white/30">
                  <p className="text-gray-300 mb-4">You haven't added any vehicles yet</p>
                  <Link to="/vehicles/add">
                    <Button className="bg-primary text-white hover:bg-primary/90">
                      <Plus className="mr-2 h-4 w-4" /> Add Your First Vehicle
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Quick Actions</h2>
              <QuickActions />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Nearby Garages</h2>
              <NearbyGarages />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Alert Notifications</h2>
              <AlertNotifications hasExpiringMOT={hasExpiringMOT} hasExpiringTax={hasExpiringTax} />
            </div>
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Dashboard;
