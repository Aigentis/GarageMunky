import { DVLAVehicleResponse, DVLAErrorResponse, DVLARequestBody, Vehicle } from "../types";
import { cleanRegistrationForApi } from "../utils/vehicleUtils";

// This key would normally be stored securely on the backend
// For demo purposes, we're using a default value that will be replaced
// with the actual API key by the user
const DEFAULT_API_KEY = "D6T2AZhZKV1oUtfKFNhj292kTEhnGKSr3unf9Sli";

interface DVLAServiceConfig {
  apiKey?: string;
  apiUrl?: string;
}

export class DVLAService {
  private apiKey: string;
  private apiUrl: string;

  constructor(config?: DVLAServiceConfig) {
    this.apiKey = config?.apiKey || DEFAULT_API_KEY;
    this.apiUrl = config?.apiUrl || 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('dvla_api_key', key);
  }

  getApiKey(): string {
    return this.apiKey || localStorage.getItem('dvla_api_key') || DEFAULT_API_KEY;
  }
  
  async getVehicleDetails(registrationNumber: string): Promise<DVLAVehicleResponse> {
    try {
      // Clean the registration number for the API request
      const cleanRegistration = cleanRegistrationForApi(registrationNumber);
      
      const payload: DVLARequestBody = {
        registrationNumber: cleanRegistration
      };

      console.log(`Sending API request for registration: ${cleanRegistration}`);

      // In a real application, this request would be made through a backend service
      // to keep the API key secure
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.getApiKey(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: DVLAErrorResponse = await response.json();
        console.error('DVLA API Error:', errorData);
        throw new Error(errorData.errorMessage || 'Failed to fetch vehicle data');
      }

      return await response.json() as DVLAVehicleResponse;
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const dvlaService = new DVLAService();

// Helper function to map DVLA API response to our Vehicle type
export const mapDvlaResponseToVehicle = (
  dvlaResponse: DVLAVehicleResponse,
  ownerId: string
): Partial<Vehicle> => {
  const currentDate = new Date();
  const motExpiryDate = dvlaResponse.motExpiryDate ? new Date(dvlaResponse.motExpiryDate) : null;
  const taxExpiryDate = dvlaResponse.taxDueDate ? new Date(dvlaResponse.taxDueDate) : null;
  
  // Calculate MOT status
  let motStatus: 'valid' | 'expired' | 'expiring_soon' = 'valid';
  if (motExpiryDate) {
    const daysToExpiry = Math.floor((motExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToExpiry < 0) {
      motStatus = 'expired';
    } else if (daysToExpiry < 30) {
      motStatus = 'expiring_soon';
    }
  } else if (dvlaResponse.motStatus === 'No MOT' || dvlaResponse.motStatus === 'Not valid') {
    motStatus = 'expired';
  }
  
  // Calculate Tax status
  let taxStatus: 'valid' | 'expired' | 'expiring_soon' = 'valid';
  if (taxExpiryDate) {
    const daysToExpiry = Math.floor((taxExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToExpiry < 0) {
      taxStatus = 'expired';
    } else if (daysToExpiry < 30) {
      taxStatus = 'expiring_soon';
    }
  } else if (dvlaResponse.taxStatus === 'SORN' || dvlaResponse.taxStatus === 'Not taxed') {
    taxStatus = 'expired';
  }
  
  return {
    registration: dvlaResponse.registrationNumber,
    make: dvlaResponse.make || 'Unknown',
    model: '', // DVLA API doesn't provide model information
    year: dvlaResponse.yearOfManufacture || new Date().getFullYear(),
    color: dvlaResponse.colour || 'Unknown',
    fuelType: dvlaResponse.fuelType || 'Unknown',
    motStatus,
    motExpiryDate: motExpiryDate ? motExpiryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    taxStatus,
    taxExpiryDate: taxExpiryDate ? taxExpiryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    mileage: 0, // DVLA API doesn't provide mileage information
    ownerId,
    specs: {
      capacity: dvlaResponse.engineCapacity ? `${dvlaResponse.engineCapacity}cc` : undefined,
    }
  };
};
