import { toast } from 'sonner';
import { Vehicle } from '../types';

// CheckCarDetails API configuration
const CHECK_CAR_DETAILS_API_KEY = import.meta.env.VITE_CHECK_CAR_DETAILS_API_KEY || '';
const CHECK_CAR_DETAILS_API_BASE_URL = 'https://api.checkcardetails.co.uk';

// Define interfaces for CheckCarDetails API responses
interface VehicleSpecsResponse {
  make: string;
  model: string;
  year: number;
  fuel: string;
  transmission: string;
  engine: {
    size: number;
    power: number;
    cylinders: number;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    weight: number;
  };
  performance: {
    acceleration: number;
    topSpeed: number;
    fuelConsumption: {
      combined: number;
      urban: number;
      extraUrban: number;
    };
    co2: number;
  };
  features: string[];
  body: {
    type: string;
    doors: number;
    seats: number;
  };
}

interface VehicleImageResponse {
  images: {
    main: string;
    additional: string[];
  };
}

interface MileageResponse {
  mileage: {
    current: number;
    history: Array<{
      date: string;
      mileage: number;
      source: string;
    }>;
  };
}

/**
 * Get vehicle specifications from CheckCarDetails API
 * @param registration Vehicle registration number
 * @returns Promise with vehicle specifications or null if not found
 */
export const getVehicleSpecs = async (registration: string): Promise<VehicleSpecsResponse | null> => {
  if (!CHECK_CAR_DETAILS_API_KEY) {
    console.warn('CheckCarDetails API key is not configured');
    return null;
  }

  try {
    // Clean the registration number - remove spaces and ensure uppercase
    const cleanedReg = registration.replace(/\\s+/g, '').toUpperCase();
    
    // For testing, ensure the registration contains the letter 'A'
    if (!cleanedReg.includes('A') && CHECK_CAR_DETAILS_API_KEY === '26a26d79495f77c52dbd8177eb7e108a') {
      console.warn('Test API key limitation: Registration must contain the letter A');
      return null;
    }
    
    const url = `${CHECK_CAR_DETAILS_API_BASE_URL}/vehicledata/vehiclespecs?apikey=${CHECK_CAR_DETAILS_API_KEY}&vrm=${cleanedReg}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('CheckCarDetails API error:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle specs from CheckCarDetails API:', error);
    return null;
  }
};

/**
 * Get vehicle image from CheckCarDetails API
 * @param registration Vehicle registration number
 * @returns Promise with vehicle image data or null if not found
 */
export const getVehicleImage = async (registration: string): Promise<VehicleImageResponse | null> => {
  if (!CHECK_CAR_DETAILS_API_KEY) {
    console.warn('CheckCarDetails API key is not configured');
    return null;
  }

  try {
    // Clean the registration number - remove spaces and ensure uppercase
    const cleanedReg = registration.replace(/\\s+/g, '').toUpperCase();
    
    // For testing, ensure the registration contains the letter 'A'
    if (!cleanedReg.includes('A') && CHECK_CAR_DETAILS_API_KEY === '26a26d79495f77c52dbd8177eb7e108a') {
      console.warn('Test API key limitation: Registration must contain the letter A');
      return null;
    }
    
    const url = `${CHECK_CAR_DETAILS_API_BASE_URL}/vehicledata/vehicleimage?apikey=${CHECK_CAR_DETAILS_API_KEY}&vrm=${cleanedReg}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('CheckCarDetails API error:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle image from CheckCarDetails API:', error);
    return null;
  }
};

/**
 * Get vehicle mileage history from CheckCarDetails API
 * @param registration Vehicle registration number
 * @returns Promise with vehicle mileage data or null if not found
 */
export const getVehicleMileage = async (registration: string): Promise<MileageResponse | null> => {
  if (!CHECK_CAR_DETAILS_API_KEY) {
    console.warn('CheckCarDetails API key is not configured');
    return null;
  }

  try {
    // Clean the registration number - remove spaces and ensure uppercase
    const cleanedReg = registration.replace(/\\s+/g, '').toUpperCase();
    
    // For testing, ensure the registration contains the letter 'A'
    if (!cleanedReg.includes('A') && CHECK_CAR_DETAILS_API_KEY === '26a26d79495f77c52dbd8177eb7e108a') {
      console.warn('Test API key limitation: Registration must contain the letter A');
      return null;
    }
    
    const url = `${CHECK_CAR_DETAILS_API_BASE_URL}/vehicledata/mileage?apikey=${CHECK_CAR_DETAILS_API_KEY}&vrm=${cleanedReg}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('CheckCarDetails API error:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle mileage from CheckCarDetails API:', error);
    return null;
  }
};

/**
 * Enhance vehicle data with information from CheckCarDetails API
 * @param vehicle Basic vehicle data
 * @returns Promise with enhanced vehicle data
 */
export const enhanceVehicleData = async (vehicle: Vehicle): Promise<Vehicle> => {
  try {
    if (!CHECK_CAR_DETAILS_API_KEY) {
      console.warn('CheckCarDetails API key is not configured');
      return vehicle;
    }

    // Clean the registration number - remove spaces and ensure uppercase
    const cleanedReg = vehicle.registration.replace(/\\s+/g, '').toUpperCase();
    
    // For testing, ensure the registration contains the letter 'A'
    if (!cleanedReg.includes('A') && CHECK_CAR_DETAILS_API_KEY === '26a26d79495f77c52dbd8177eb7e108a') {
      console.warn('Test API key limitation: Registration must contain the letter A');
      return vehicle;
    }
    
    let enhancedVehicle = { ...vehicle };
    
    // Try to get vehicle specifications
    try {
      toast.info('Fetching additional vehicle details...');
      const specsData = await getVehicleSpecs(cleanedReg);
      
      if (specsData) {
        enhancedVehicle = {
          ...enhancedVehicle,
          transmission: specsData.transmission || enhancedVehicle.transmission,
          bodyType: specsData.body?.type || enhancedVehicle.bodyType,
          specs: {
            ...enhancedVehicle.specs,
            power: `${specsData.engine?.power || 0} hp`,
            consumption: `${specsData.performance?.fuelConsumption?.combined || 0} mpg`,
            capacity: `${specsData.engine?.size || 0}L`,
            seats: specsData.body?.seats || 0,
            features: specsData.features || [],
            engine: {
              type: specsData.fuel || '',
              cylinders: specsData.engine?.cylinders || 0,
              displacement: specsData.engine?.size || 0,
              fuelType: specsData.fuel || '',
              horsepower: specsData.engine?.power || 0,
              torque: 0, // Not provided by the API
            },
            transmission: {
              type: specsData.transmission || '',
              speeds: 0, // Not provided by the API
            },
            dimensions: {
              doors: specsData.body?.doors || 0,
              length: specsData.dimensions?.length || 0,
              width: specsData.dimensions?.width || 0,
              height: specsData.dimensions?.height || 0,
              wheelbase: specsData.dimensions?.wheelbase || 0,
            },
          },
        };
        
        toast.success('Found additional vehicle specifications');
      }
    } catch (specsError) {
      console.error('Error fetching vehicle specs:', specsError);
      // Continue with other API calls
    }
    
    // Try to get vehicle image
    try {
      const imageData = await getVehicleImage(cleanedReg);
      
      if (imageData && imageData.images?.main) {
        enhancedVehicle.image = imageData.images.main;
        toast.success('Found vehicle image');
      }
    } catch (imageError) {
      console.error('Error fetching vehicle image:', imageError);
      // Continue with other API calls
    }
    
    // Try to get vehicle mileage if not already available
    if (!enhancedVehicle.mileage || enhancedVehicle.mileage === 0) {
      try {
        const mileageData = await getVehicleMileage(cleanedReg);
        
        if (mileageData && mileageData.mileage?.current) {
          enhancedVehicle.mileage = mileageData.mileage.current;
          toast.success('Found vehicle mileage');
        }
      } catch (mileageError) {
        console.error('Error fetching vehicle mileage:', mileageError);
        // Continue without mileage data
      }
    }
    
    return enhancedVehicle;
  } catch (error) {
    console.error('Error enhancing vehicle data:', error);
    toast.error('Could not fetch additional vehicle details');
    return vehicle;
  }
};

// For demo/development purposes, create mock data based on the vehicle
export const getMockEnhancedData = (vehicle: Vehicle): Vehicle => {
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
    image: vehicle.image || `https://example.com/car-images/${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase().replace(/\s+/g, '-')}.jpg`,
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
};

export default {
  getVehicleSpecs,
  getVehicleImage,
  getVehicleMileage,
  enhanceVehicleData,
  getMockEnhancedData,
};
