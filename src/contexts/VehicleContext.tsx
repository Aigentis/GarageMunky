
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Vehicle } from '../types';
import { mockVehicles } from '../data/mockData';
import { useUser } from './UserContext';
import { useAuth, UserRole } from './AuthContext';
import { dvlaService, mapDvlaResponseToVehicle } from '../services/dvlaService';
import { enhanceVehicleData } from '../services/checkCarDetailsService';
import { toast } from 'sonner';
import appwriteService from '../services/appwrite';
import { ID, Models } from 'appwrite';

// Define interfaces for user types
interface LegacyUser {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  location?: string;
  role?: string;
}

interface AppwriteUser {
  $id: string;
  name: string;
  email: string;
  profile?: {
    avatar?: string;
    location?: string;
  };
  role?: UserRole;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  userVehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  getVehicle: (id: string) => Vehicle | undefined;
  getVehicleById: (id: string) => Vehicle | undefined;
  getVehicleByRegistration: (registration: string) => Vehicle | undefined;
  fetchVehicleData: (registration: string) => Promise<Vehicle | null>;
  fetchDvlaVehicleData: (registration: string) => Promise<Vehicle | null>;
  updateVehicle: (updatedVehicle: Vehicle) => Promise<void>;
  deleteVehicle: (id: string) => Promise<boolean>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user: legacyUser } = useUser() as { user: LegacyUser | null };
  const { user } = useAuth();
  // Cast the user to our AppwriteUser type
  const appwriteUser = user as AppwriteUser;
  
  // Get the current user ID from either context
  const userId = appwriteUser?.$id || legacyUser?.id || '';

  // Filter vehicles that belong to the current user
  const userVehicles = vehicles.filter(
    (vehicle) => userId && vehicle.ownerId === userId
  );

  // Get a vehicle by its ID
  const getVehicle = (id: string): Vehicle | undefined => {
    console.log('Looking for vehicle with ID:', id);
    console.log('Available vehicles:', vehicles);
    
    // Check if the ID is actually a registration number (contains letters and numbers)
    if (/^[A-Z0-9]+$/.test(id.toUpperCase())) {
      // First try to find by ID
      const vehicleById = vehicles.find((vehicle) => vehicle.id === id);
      if (vehicleById) {
        console.log('Found vehicle by ID:', vehicleById);
        return vehicleById;
      }
      
      // If not found by ID, try by registration (for backward compatibility)
      const cleanedReg = id.replace(/\s+/g, '').toUpperCase();
      const vehicleByReg = vehicles.find(
        (vehicle) => vehicle.registration.replace(/\s+/g, '').toUpperCase() === cleanedReg
      );
      
      if (vehicleByReg) {
        console.log('Found vehicle by registration:', vehicleByReg);
        return vehicleByReg;
      }
    } else {
      // Regular ID lookup
      const vehicle = vehicles.find((vehicle) => vehicle.id === id);
      console.log('Found vehicle:', vehicle);
      return vehicle;
    }
    
    return undefined;
  };

  // Get a vehicle by registration number
  const getVehicleByRegistration = (registration: string): Vehicle | undefined => {
    const cleanedReg = registration.replace(/\s+/g, '').toUpperCase();
    console.log('Looking for vehicle with registration:', cleanedReg);
    
    const vehicle = vehicles.find(
      (vehicle) => vehicle.registration.replace(/\s+/g, '').toUpperCase() === cleanedReg
    );
    
    console.log('Found vehicle by registration:', vehicle);
    return vehicle;
  };

  // Alias for backward compatibility
  const getVehicleById = getVehicle;

  // Fetch vehicle data from DVLA API
  const fetchDvlaVehicleData = async (registration: string): Promise<Vehicle | null> => {
    setLoading(true);
    setError(null);

    try {
      // Clean the registration number - remove spaces and ensure uppercase
      const cleanedReg = registration.replace(/\s+/g, '').toUpperCase();
      console.log('Fetching DVLA data for cleaned registration:', cleanedReg);
      
      const dvlaResponse = await dvlaService.getVehicleDetails(cleanedReg);
      
      // Map the DVLA response to our Vehicle type
      const vehicleData = mapDvlaResponseToVehicle(dvlaResponse, userId || '');
      
      // Generate an ID for the new vehicle
      const id = `vehicle${vehicles.length + 1}`;
      
      // Create a new vehicle with the DVLA data
      const newVehicle: Vehicle = {
        id,
        ownerId: userId || '',
        registration: cleanedReg,
        make: vehicleData.make || 'Unknown',
        model: vehicleData.model || 'Unknown Model',
        year: vehicleData.year || new Date().getFullYear(),
        color: vehicleData.color || 'Unknown',
        fuelType: vehicleData.fuelType || 'Unknown',
        motStatus: vehicleData.motStatus || 'valid',
        motExpiryDate: vehicleData.motExpiryDate || new Date().toISOString().split('T')[0],
        taxStatus: vehicleData.taxStatus || 'valid',
        taxExpiryDate: vehicleData.taxExpiryDate || new Date().toISOString().split('T')[0],
        mileage: vehicleData.mileage || 0,
        ...vehicleData
      };
      
      // Add the new vehicle to the vehicles state
      const updatedVehicles = [...vehicles, newVehicle];
      setVehicles(updatedVehicles);
      
      return newVehicle;
    } catch (error) {
      setError('Failed to fetch vehicle data from DVLA API');
      console.error('DVLA API error:', error);
      toast.error('Failed to fetch vehicle data');
      return null;
    }
  };

  // Fetch vehicle data from DVLA API only (basic data)
  const fetchVehicleData = async (registration: string): Promise<Vehicle | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching vehicle data for registration: ${registration}`);
      
      // First, try to get the vehicle from our existing vehicles
      const existingVehicle = getVehicleByRegistration(registration);
      if (existingVehicle) {
        console.log('Vehicle already exists:', existingVehicle);
        return existingVehicle;
      }
      
      // Try to fetch from DVLA API first - this is the basic data available to all users
      let vehicleData: Vehicle | null = null;
      
      try {
        const dvlaVehicle = await fetchDvlaVehicleData(registration);
        if (dvlaVehicle) {
          console.log('Successfully fetched from DVLA API:', dvlaVehicle);
          vehicleData = dvlaVehicle;
        }
      } catch (dvlaError) {
        console.error('DVLA API failed:', dvlaError);
      }
      
      // If no data from DVLA and registration contains 'A', create mock data
      if (!vehicleData && registration.toUpperCase().includes('A')) {
        // Generate a mock vehicle using the registration
        const id = ID.unique();
        vehicleData = {
          id,
          registration: registration.toUpperCase(),
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          color: 'Silver',
          ownerId: userId,
          image: 'https://example.com/car.jpg',
          fuelType: 'Petrol',
          motStatus: 'valid',
          motExpiryDate: '2024-11-30',
          taxStatus: 'valid',
          taxExpiryDate: '2024-09-30',
          mileage: 25000,
        };
        
        // Add to local state
        setVehicles([...vehicles, vehicleData]);
        
        console.log('Generated mock vehicle:', vehicleData);
        setLoading(false);
        return vehicleData;
      }
      
      // Save to Appwrite if user is logged in
      if (userId) {
        try {
          // Create vehicle in Appwrite
          const savedVehicle = await appwriteService.createVehicle({
            registration: vehicleData.registration,
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year,
            color: vehicleData.color,
            fuelType: vehicleData.fuelType,
            motStatus: vehicleData.motStatus,
            motExpiryDate: vehicleData.motExpiryDate,
            taxStatus: vehicleData.taxStatus,
            taxExpiryDate: vehicleData.taxExpiryDate,
            mileage: vehicleData.mileage,
            image: vehicleData.image,
            ownerId: userId
          });
          
          if (savedVehicle && savedVehicle.$id) {
            // Update the vehicle with the Appwrite ID
            const vehicleWithId = {
              ...vehicleData,
              id: savedVehicle.$id
            };
            
            // Add to local state
            setVehicles([...vehicles, vehicleWithId]);
            
            console.log('Vehicle saved to Appwrite:', vehicleWithId);
            return vehicleWithId;
          }
        } catch (error: any) {
          // Check if the error is due to missing collection
          if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
            console.log('Vehicles collection does not exist yet. Please run the setup-appwrite script.');
            toast.error('Database setup required. Please contact support.');
          } else {
            console.error('Failed to save vehicle to Appwrite:', error);
            toast.error('Failed to save vehicle data');
          }
          
          // Generate a temporary ID for the vehicle
          const tempVehicle = {
            ...vehicleData,
            id: 'temp_' + ID.unique()
          };
          
          // Add to local state anyway so user can see their vehicle
          setVehicles([...vehicles, tempVehicle]);
          
          // Continue with the enhanced data even if saving to Appwrite fails
          return tempVehicle;
        }
      }
      
      // If we couldn't save to Appwrite, still return the vehicle data
      setLoading(false);
      return vehicleData;
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      setError('Failed to fetch vehicle data');
      setLoading(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load vehicles from Appwrite when the component mounts or user changes
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!userId) {
        setVehicles([]);
        setLoading(false);
        return;
      }
      
      try {
        // Fetch vehicles from Appwrite
        const response = await appwriteService.getUserVehicles(userId);
        
        if (response && response.documents && response.documents.length > 0) {
          const fetchedVehicles = response.documents.map((doc: any) => ({
            id: doc.$id,
            registration: doc.registration,
            make: doc.make,
            model: doc.model,
            year: doc.year,
            color: doc.color,
            fuelType: doc.fuelType,
            motStatus: doc.motStatus,
            motExpiryDate: doc.motExpiryDate,
            taxStatus: doc.taxStatus,
            taxExpiryDate: doc.taxExpiryDate,
            mileage: doc.mileage,
            image: doc.image,
            ownerId: doc.ownerId
          }));
          
          setVehicles(fetchedVehicles);
          console.log('Fetched vehicles from Appwrite:', fetchedVehicles);
        } else {
          setVehicles([]);
        }
      } catch (err: any) {
        console.error('Error fetching vehicles from Appwrite:', err);
        
        // Check if the error is due to missing collection
        if (err.message && err.message.includes('Collection with the requested ID could not be found')) {
          console.log('Vehicles collection does not exist yet. This is normal for new installations.');
          // Don't show error to user for this specific case
          setError(null);
        } else {
          setError('Failed to fetch vehicles');
        }
        
        // Fall back to mock data in development
        if (import.meta.env.DEV) {
          setVehicles(mockVehicles.filter(v => v.ownerId === userId));
          console.log('Using mock vehicles data in development');
        } else {
          setVehicles([]);
        }
      } finally {
        setLoading(false);
      }  
    };
    
    fetchVehicles();
  }, [userId]);

  // Update an existing vehicle's details
  const updateVehicle = async (updatedVehicle: Vehicle): Promise<void> => {
    try {
      // Update in Appwrite
      await appwriteService.updateVehicle(updatedVehicle.id, {
        registration: updatedVehicle.registration,
        make: updatedVehicle.make,
        model: updatedVehicle.model,
        year: updatedVehicle.year,
        color: updatedVehicle.color,
        fuelType: updatedVehicle.fuelType,
        motStatus: updatedVehicle.motStatus,
        motExpiryDate: updatedVehicle.motExpiryDate,
        taxStatus: updatedVehicle.taxStatus,
        taxExpiryDate: updatedVehicle.taxExpiryDate,
        mileage: updatedVehicle.mileage,
        image: updatedVehicle.image,
        ownerId: updatedVehicle.ownerId
      });
      
      // Update in local state
      const index = vehicles.findIndex(v => v.id === updatedVehicle.id);
      
      if (index !== -1) {
        // Create a new array with the updated vehicle
        const updatedVehicles = [...vehicles];
        updatedVehicles[index] = updatedVehicle;
        
        // Update state
        setVehicles(updatedVehicles);
        
        console.log('Vehicle updated in Appwrite and local state:', updatedVehicle);
        toast.success('Vehicle updated successfully');
      } else {
        // If not found in local state, add it
        setVehicles([...vehicles, updatedVehicle]);
        console.log('Vehicle added to local state:', updatedVehicle);
      }
    } catch (error) {
      console.error('Failed to update vehicle in Appwrite:', error);
      toast.error('Failed to update vehicle');
    }
  };
  
  // Delete a vehicle by ID
  const deleteVehicle = async (id: string): Promise<boolean> => {
    try {
      // Delete from Appwrite
      await appwriteService.deleteVehicle(id);
      
      // Delete from local state
      const updatedVehicles = vehicles.filter(v => v.id !== id);
      setVehicles(updatedVehicles);
      
      console.log('Vehicle deleted from Appwrite and local state:', id);
      toast.success('Vehicle deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete vehicle from Appwrite:', error);
      toast.error('Failed to delete vehicle');
      return false;
    }
  };

  // This is a duplicate useEffect that was in the original code
  // We've already implemented the vehicle loading logic in the first useEffect

  const value: VehicleContextType = {
    vehicles,
    userVehicles,
    loading,
    error,
    getVehicle,
    getVehicleById,
    getVehicleByRegistration,
    fetchVehicleData,
    fetchDvlaVehicleData,
    updateVehicle,
    deleteVehicle,
  };

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
};

export const useVehicles = (): VehicleContextType => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
};
