import { toast } from 'sonner';
import { Vehicle } from '../types';

// Edmunds API configuration
const EDMUNDS_API_KEY = import.meta.env.VITE_EDMUNDS_API_KEY || '';
const EDMUNDS_API_BASE_URL = 'https://api.edmunds.com/api/vehicle/v2';

// Check if we have a valid API key (not the placeholder)
const hasValidApiKey = EDMUNDS_API_KEY && EDMUNDS_API_KEY !== 'YOUR_EDMUNDS_API_KEY_HERE';

// Define interfaces for Edmunds API responses
interface EdmundsVehicleDetails {
  make: {
    name: string;
    niceName: string;
  };
  model: {
    name: string;
    niceName: string;
  };
  years: Array<{
    year: number;
    styles: Array<{
      id: string;
      name: string;
      trim: string;
      body: string;
      engineType: string;
      transmissionType: string;
      drivenWheels: string;
      numOfDoors: number;
      options: Array<{
        category: string;
        name: string;
        optionId: string;
      }>;
      colors: Array<{
        category: string;
        name: string;
        colorId: string;
      }>;
    }>;
  }>;
  engine: {
    name: string;
    type: string;
    cylinder: number;
    size: number;
    displacement: number;
    fuelType: string;
    horsepower: number;
    torque: number;
  };
  transmission: {
    name: string;
    type: string;
    numberOfSpeeds: number;
  };
}

interface EdmundsVinDecodingResponse {
  years: Array<{
    year: number;
    styles: Array<{
      id: string;
      name: string;
      trim: string;
      body: string;
    }>;
  }>;
  make: {
    id: string;
    name: string;
    niceName: string;
  };
  model: {
    id: string;
    name: string;
    niceName: string;
  };
  engine: {
    id: string;
    name: string;
    equipmentType: string;
    availability: string;
    compressionRatio: number;
    cylinder: number;
    size: number;
    displacement: number;
    configuration: string;
    fuelType: string;
    horsepower: number;
    torque: number;
    totalValves: number;
    manufacturerEngineCode: string;
    type: string;
    code: string;
    compressorType: string;
  };
  transmission: {
    id: string;
    name: string;
    equipmentType: string;
    availability: string;
    automaticType: string;
    transmissionType: string;
    numberOfSpeeds: number;
  };
  drivenWheels: string;
  numOfDoors: number;
  options: Array<{
    category: string;
    name: string;
    optionId: string;
  }>;
  colors: Array<{
    category: string;
    name: string;
    colorId: string;
  }>;
  manufacturerCode: string;
  price: {
    baseMSRP: number;
    baseInvoice: number;
    deliveryCharges: number;
    usedTmvRetail: number;
    usedPrivateParty: number;
    usedTradeIn: number;
    estimateTmv: boolean;
  };
  categories: {
    market: string;
    EPAClass: string;
    vehicleSize: string;
    primaryBodyType: string;
    vehicleStyle: string;
    vehicleType: string;
  };
}

/**
 * Decode a VIN using the Edmunds API
 * @param vin Vehicle Identification Number
 * @returns Promise with vehicle details or null if not found
 */
export const decodeVin = async (vin: string): Promise<EdmundsVinDecodingResponse | null> => {
  if (!hasValidApiKey) {
    console.warn('Edmunds API key is not configured or is set to the placeholder value');
    return null;
  }

  try {
    // In a production environment, this would be handled by a backend proxy to avoid CORS issues
    // For now, we'll use a mock response for demonstration purposes
    console.log(`Would fetch VIN data for: ${vin} (disabled due to CORS restrictions)`); 
    
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return null to indicate we couldn't get real data
    return null;
  } catch (error) {
    console.error('Error decoding VIN with Edmunds API:', error);
    return null;
  }
};

/**
 * Get vehicle details by make, model, and year
 * @param make Vehicle make
 * @param model Vehicle model
 * @param year Vehicle year
 * @returns Promise with vehicle details or null if not found
 */
export const getVehicleDetails = async (
  make: string,
  model: string,
  year: number
): Promise<EdmundsVehicleDetails | null> => {
  if (!hasValidApiKey) {
    console.warn('Edmunds API key is not configured or is set to the placeholder value');
    return null;
  }

  try {
    // Convert make and model to "nice names" (lowercase, hyphenated)
    const makeNiceName = make.toLowerCase().replace(/\s+/g, '-');
    const modelNiceName = model.toLowerCase().replace(/\s+/g, '-');
    
    // In a production environment, this would be handled by a backend proxy to avoid CORS issues
    // For now, we'll use a mock response for demonstration purposes
    console.log(`Would fetch vehicle details for: ${makeNiceName}/${modelNiceName}/${year} (disabled due to CORS restrictions)`);
    
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return null to indicate we couldn't get real data
    return null;
  } catch (error) {
    console.error('Error fetching vehicle details from Edmunds API:', error);
    return null;
  }
};

/**
 * Enhance vehicle data with information from Edmunds API
 * @param vehicle Basic vehicle data
 * @returns Promise with enhanced vehicle data
 */
export const enhanceVehicleData = async (vehicle: Vehicle): Promise<Vehicle> => {
  try {
    // If the API key is not valid, return the original vehicle data
    if (!hasValidApiKey) {
      console.warn('Skipping Edmunds API enhancement - API key not configured');
      return vehicle;
    }
    
    // For demonstration purposes, we'll add some mock enhanced data
    // In a production environment, this would come from the actual API
    console.log(`Enhancing vehicle data for ${vehicle.make} ${vehicle.model} with mock data`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create enhanced vehicle with mock data based on the vehicle type
    const enhancedVehicle = {
      ...vehicle,
      transmission: vehicle.transmission || (vehicle.make.toLowerCase().includes('tesla') ? 'Automatic' : 'Manual'),
      drivetrain: vehicle.drivetrain || (vehicle.make.toLowerCase().includes('tesla') ? 'AWD' : 'FWD'),
      engine: vehicle.engine || (vehicle.make.toLowerCase().includes('tesla') ? 'Electric' : `${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 9)}L ${Math.floor(Math.random() * 4) + 4}-Cylinder`),
      horsepower: vehicle.horsepower || (vehicle.make.toLowerCase().includes('tesla') ? 450 : 150 + Math.floor(Math.random() * 200)),
      bodyType: vehicle.bodyType || (vehicle.model.toLowerCase().includes('model s') ? 'Sedan' : 
                                  vehicle.model.toLowerCase().includes('picasso') ? 'MPV' : 
                                  'Hatchback'),
      specs: {
        ...vehicle.specs,
        engine: {
          type: vehicle.make.toLowerCase().includes('tesla') ? 'Electric' : 'Internal Combustion',
          cylinders: vehicle.make.toLowerCase().includes('tesla') ? 0 : 4,
          displacement: vehicle.make.toLowerCase().includes('tesla') ? 0 : 1.6,
          fuelType: vehicle.fuelType || (vehicle.make.toLowerCase().includes('tesla') ? 'Electric' : 'Petrol'),
          horsepower: vehicle.horsepower || (vehicle.make.toLowerCase().includes('tesla') ? 450 : 150 + Math.floor(Math.random() * 200)),
          torque: vehicle.make.toLowerCase().includes('tesla') ? 470 : 200 + Math.floor(Math.random() * 150),
        },
        transmission: {
          type: vehicle.make.toLowerCase().includes('tesla') ? 'Automatic' : 'Manual',
          speeds: vehicle.make.toLowerCase().includes('tesla') ? 1 : 6,
        },
        dimensions: {
          doors: 5,
          length: 4500 + Math.floor(Math.random() * 500),
          width: 1800 + Math.floor(Math.random() * 200),
          height: 1500 + Math.floor(Math.random() * 200),
          wheelbase: 2700 + Math.floor(Math.random() * 300),
        },
        power: vehicle.make.toLowerCase().includes('tesla') ? '450 hp' : `${150 + Math.floor(Math.random() * 200)} hp`,
        consumption: vehicle.make.toLowerCase().includes('tesla') ? '0.0 L/100km' : `${5 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 9)} L/100km`,
        capacity: vehicle.make.toLowerCase().includes('tesla') ? '100 kWh' : `${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 9)}L`,
        seats: 5,
        features: [
          'Air Conditioning',
          'Power Windows',
          'Bluetooth',
          'Navigation System',
          'Parking Sensors'
        ]
      }
    };
    
    return enhancedVehicle;
  } catch (error) {
    console.error('Error enhancing vehicle data:', error);
    toast.error('Could not fetch additional vehicle details');
    return vehicle;
  }
};

export default {
  decodeVin,
  getVehicleDetails,
  enhanceVehicleData,
};
