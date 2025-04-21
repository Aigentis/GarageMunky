
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Vehicle } from '../types';
import { mockVehicles } from '../data/mockData';
import { useUser } from './UserContext';
import { dvlaService, mapDvlaResponseToVehicle } from '../services/dvlaService';
import { toast } from 'sonner';

interface VehicleContextType {
  vehicles: Vehicle[];
  userVehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  getVehicleById: (id: string) => Vehicle | undefined;
  fetchVehicleData: (registration: string) => Promise<Vehicle | null>;
  fetchDvlaVehicleData: (registration: string) => Promise<Vehicle | null>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // Filter vehicles that belong to the current user
  const userVehicles = vehicles.filter(
    (vehicle) => user && vehicle.ownerId === user.id
  );

  // Get a vehicle by its ID
  const getVehicleById = (id: string): Vehicle | undefined => {
    return vehicles.find((vehicle) => vehicle.id === id);
  };

  // Fetch vehicle data from DVLA API
  const fetchDvlaVehicleData = async (registration: string): Promise<Vehicle | null> => {
    setLoading(true);
    setError(null);

    try {
      const dvlaResponse = await dvlaService.getVehicleDetails(registration);
      
      // Map the DVLA response to our Vehicle type
      const vehicleData = mapDvlaResponseToVehicle(dvlaResponse, user?.id || '');
      
      // Generate an ID for the new vehicle
      const id = `vehicle${vehicles.length + 1}`;
      
      // Create a new vehicle with the DVLA data
      const newVehicle: Vehicle = {
        id,
        ownerId: user?.id || '',
        registration: registration.toUpperCase(),
        make: vehicleData.make || 'Unknown',
        model: vehicleData.model || 'Unknown Model', // We'll need the user to provide this
        year: vehicleData.year || new Date().getFullYear(),
        color: vehicleData.color || 'Unknown',
        fuelType: vehicleData.fuelType || 'Unknown',
        motStatus: vehicleData.motStatus || 'valid',
        motExpiryDate: vehicleData.motExpiryDate || new Date().toISOString().split('T')[0],
        taxStatus: vehicleData.taxStatus || 'valid',
        taxExpiryDate: vehicleData.taxExpiryDate || new Date().toISOString().split('T')[0],
        mileage: 0, // Default mileage, user can update
        specs: vehicleData.specs,
      };
      
      // Add the new vehicle to the list
      setVehicles([...vehicles, newVehicle]);
      
      // Return the new vehicle
      return newVehicle;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicle data from DVLA');
      console.error(err);
      toast.error('Failed to fetch vehicle data from DVLA');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mock function to fetch vehicle data from registration
  const fetchVehicleData = async (registration: string): Promise<Vehicle | null> => {
    setLoading(true);
    setError(null);

    try {
      // In a real app, this would call the UK GOV API
      console.log('Fetching data for registration:', registration);
      
      // Check for the API key to determine which method to use
      const apiKey = dvlaService.getApiKey();
      
      // If we have an API key, try the DVLA API first
      if (apiKey && apiKey !== 'null') {
        try {
          return await fetchDvlaVehicleData(registration);
        } catch (dvlaError) {
          console.error('DVLA API failed, falling back to mock data:', dvlaError);
          // Fall back to mock data
        }
      }
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Return mock data for the demo
      const mockVehicle = mockVehicles.find(v => 
        v.registration.replace(' ', '').toLowerCase() === registration.replace(' ', '').toLowerCase()
      );
      
      if (mockVehicle) {
        return mockVehicle;
      }
      
      // If no match, return a new mock vehicle
      const newVehicle: Vehicle = {
        id: `vehicle${vehicles.length + 1}`,
        ownerId: user?.id || '',
        registration: registration.toUpperCase(),
        make: 'Ford',
        model: 'Focus',
        year: 2020,
        color: 'Blue',
        fuelType: 'Petrol',
        motStatus: 'valid',
        motExpiryDate: '2024-11-30',
        taxStatus: 'valid',
        taxExpiryDate: '2024-09-30',
        mileage: 25000,
      };
      
      setVehicles([...vehicles, newVehicle]);
      return newVehicle;
    } catch (err) {
      setError('Failed to fetch vehicle data');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load vehicles when the component mounts
  useEffect(() => {
    // In a real app, this would fetch from an API
    setLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const value = {
    vehicles,
    userVehicles,
    loading,
    error,
    getVehicleById,
    fetchVehicleData,
    fetchDvlaVehicleData,
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
