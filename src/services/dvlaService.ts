import { DVLAVehicleResponse, DVLAErrorResponse, DVLARequestBody, Vehicle } from "../types";
import { cleanRegistrationForApi } from "../utils/vehicleUtils";

// Get the API key from environment variables if available
const DEFAULT_API_KEY = import.meta.env.VITE_DVLA_API_KEY || "D6T2AZhZKV1oUtfKFNhj292kTEhnGKSr3unf9Sli";

// Cache configuration
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

interface CacheEntry {
  data: DVLAVehicleResponse;
  timestamp: number;
}

// Validation regex for UK vehicle registration numbers
const UK_REG_NUMBER_REGEX = /^[A-Z0-9]{2,7}$/;

interface DVLAServiceConfig {
  apiKey?: string;
  apiUrl?: string;
  enableCache?: boolean;
  cacheExpiryMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class DVLAService {
  private apiKey: string;
  private apiUrl: string;
  private cache: Map<string, CacheEntry>;
  private enableCache: boolean;
  private cacheExpiryMs: number;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config?: DVLAServiceConfig) {
    this.apiKey = config?.apiKey || DEFAULT_API_KEY;
    this.apiUrl = config?.apiUrl || 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';
    this.enableCache = config?.enableCache !== undefined ? config.enableCache : true;
    this.cacheExpiryMs = config?.cacheExpiryMs || CACHE_EXPIRY_MS;
    this.maxRetries = config?.maxRetries || MAX_RETRY_ATTEMPTS;
    this.retryDelayMs = config?.retryDelayMs || RETRY_DELAY_MS;
    this.cache = new Map<string, CacheEntry>();
    
    // Load any cached vehicles from localStorage on initialization
    this.loadCacheFromStorage();
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('dvla_api_key', key);
  }

  getApiKey(): string {
    return this.apiKey || localStorage.getItem('dvla_api_key') || DEFAULT_API_KEY;
  }
  
  /**
   * Validates a UK vehicle registration number format
   * @param regNumber The registration number to validate
   * @returns boolean indicating if the format is valid
   */
  validateRegistrationFormat(regNumber: string): boolean {
    const cleaned = cleanRegistrationForApi(regNumber);
    return UK_REG_NUMBER_REGEX.test(cleaned);
  }
  
  /**
   * Loads cached vehicle data from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const cachedData = localStorage.getItem('dvla_vehicle_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData) as Record<string, CacheEntry>;
        this.cache = new Map(Object.entries(parsed));
        
        // Clean expired entries
        this.cleanExpiredCache();
      }
    } catch (error) {
      console.error('Error loading DVLA cache from storage:', error);
      // If there's an error loading the cache, initialize an empty one
      this.cache = new Map();
    }
  }
  
  /**
   * Saves the current cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      // Convert Map to object for storage
      const cacheObj = Object.fromEntries(this.cache.entries());
      localStorage.setItem('dvla_vehicle_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Error saving DVLA cache to storage:', error);
    }
  }
  
  /**
   * Removes expired entries from the cache
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    let expired = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpiryMs) {
        this.cache.delete(key);
        expired++;
      }
    }
    
    if (expired > 0) {
      console.log(`Cleaned ${expired} expired vehicle records from cache`);
      this.saveCacheToStorage();
    }
  }
  
  /**
   * Adds a vehicle to the cache
   */
  private cacheVehicle(registration: string, data: DVLAVehicleResponse): void {
    if (!this.enableCache) return;
    
    const cleaned = cleanRegistrationForApi(registration);
    this.cache.set(cleaned, {
      data,
      timestamp: Date.now()
    });
    
    this.saveCacheToStorage();
  }
  
  /**
   * Gets a vehicle from cache if available and not expired
   */
  private getCachedVehicle(registration: string): DVLAVehicleResponse | null {
    if (!this.enableCache) return null;
    
    const cleaned = cleanRegistrationForApi(registration);
    const cached = this.cache.get(cleaned);
    
    if (!cached) return null;
    
    // Check if entry has expired
    if (Date.now() - cached.timestamp > this.cacheExpiryMs) {
      this.cache.delete(cleaned);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Clears the vehicle cache
   */
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('dvla_vehicle_cache');
  }
  
  /**
   * Retrieves vehicle details from the DVLA API with caching and retry support
   * @param registrationNumber The vehicle registration number
   * @param forceRefresh Whether to bypass cache and fetch fresh data
   * @returns The vehicle details
   */
  async getVehicleDetails(registrationNumber: string, forceRefresh = false): Promise<DVLAVehicleResponse> {
    console.log(`DVLA Service: Getting vehicle details for ${registrationNumber}`);
    console.log(`Using API key from env: ${import.meta.env.VITE_DVLA_API_KEY ? 'Yes (available)' : 'No (not available)'}`);

    // Validate the registration format
    if (!this.validateRegistrationFormat(registrationNumber)) {
      throw new Error('Invalid vehicle registration format. Please use a standard UK format (e.g., AB12CDE)');
    }
    
    // Clean the registration number for the API request
    const cleanRegistration = cleanRegistrationForApi(registrationNumber);
    
    // Check cache first if not forcing a refresh
    if (!forceRefresh) {
      const cachedVehicle = this.getCachedVehicle(cleanRegistration);
      if (cachedVehicle) {
        console.log(`Using cached data for registration: ${cleanRegistration}`);
        return cachedVehicle;
      }
    }
    
    // Prepare the request payload
    const payload: DVLARequestBody = {
      registrationNumber: cleanRegistration
    };

    console.log(`Sending API request for registration: ${cleanRegistration}`);

    // For development, use a local proxy endpoint to avoid CORS issues
    // In production, this should be handled by a backend service
    const useLocalProxy = true;
    const apiUrl = useLocalProxy 
      ? '/api/vehicle-enquiry' // This should be configured in your Vite config or backend
      : this.apiUrl;
      
    // Initialize retry counter
    let retryCount = 0;
    let lastError: Error | null = null;
    
    // Retry loop
    while (retryCount <= this.maxRetries) {
      try {
        // Get API key with preference for environment variable
        const apiKey = import.meta.env.VITE_DVLA_API_KEY || this.getApiKey();
        console.log(`Making DVLA API request to: ${apiUrl}`);
        console.log(`Request payload: ${JSON.stringify(payload)}`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to fetch vehicle data';
          let responseText = '';
          
          try {
            // Attempt to parse error response
            const errorData: DVLAErrorResponse = await response.json();
            console.error('DVLA API Error:', errorData);
            responseText = JSON.stringify(errorData);
            
            // Map status codes to user-friendly messages
            switch (response.status) {
              case 400:
                errorMessage = errorData.errorMessage || 'Invalid request. Please check the registration number format.';
                break;
              case 401:
              case 403:
                errorMessage = 'API key invalid or expired. Please update your DVLA API key.';
                break;
              case 404:
                errorMessage = 'Vehicle not found. Please check the registration number is correct.';
                break;
              case 429:
                errorMessage = 'Too many requests. Please try again later.';
                // This one is worth retrying after a delay
                throw new Error(errorMessage);
              case 500:
              case 503:
                errorMessage = 'The DVLA service is currently unavailable. Please try again later.';
                // Server errors are worth retrying
                throw new Error(errorMessage);
              default:
                errorMessage = errorData.errorMessage || 'Failed to fetch vehicle data';
            }
            
            // These status codes aren't worth retrying, so throw a non-retryable error
            const error = new Error(errorMessage);
            (error as any).nonRetryable = true;
            (error as any).responseText = responseText;
            throw error;
            
          } catch (parseError) {
            // If we can't parse the response as JSON, just use the status text
            if ((parseError as any).nonRetryable) {
              throw parseError; // Re-throw our custom error
            }
            
            errorMessage = `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
          }
        }

        // If we get here, the request was successful
        const vehicleData = await response.json() as DVLAVehicleResponse;
        
        // Cache the successful response
        this.cacheVehicle(cleanRegistration, vehicleData);
        
        return vehicleData;
        
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is marked as non-retryable
        if ((error as any).nonRetryable) {
          break;
        }
        
        // If we haven't exceeded retries, wait and try again
        if (retryCount < this.maxRetries) {
          console.log(`Retrying DVLA request (${retryCount + 1}/${this.maxRetries}) after error:`, error);
          await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * Math.pow(2, retryCount)));
          retryCount++;
        } else {
          break;
        }
      }
    }
    
    // If we get here, all retries failed
    console.error('All DVLA API request attempts failed');
    throw lastError || new Error('Failed to fetch vehicle data after multiple attempts');
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
  
  // Build a more comprehensive specs object from all available DVLA data
  const specs = {
    capacity: dvlaResponse.engineCapacity ? `${dvlaResponse.engineCapacity}cc` : undefined,
    emissions: dvlaResponse.co2Emissions ? `${dvlaResponse.co2Emissions}g/km` : undefined,
    euroStatus: dvlaResponse.euroStatus || undefined,
    realDrivingEmissions: dvlaResponse.realDrivingEmissions || undefined,
    wheelplan: dvlaResponse.wheelplan || undefined,
    typeApproval: dvlaResponse.typeApproval || undefined,
    revenueWeight: dvlaResponse.revenueWeight ? `${dvlaResponse.revenueWeight}kg` : undefined,
    firstRegistration: dvlaResponse.monthOfFirstRegistration || undefined,
    lastV5CIssued: dvlaResponse.dateOfLastV5CIssued || undefined,
    markedForExport: dvlaResponse.markedForExport ? 'Yes' : 'No',
  };
  
  // Try to infer model from typeApproval or other fields if available
  let inferredModel = '';
  
  // The typeApproval field sometimes contains model information after the make
  if (dvlaResponse.typeApproval && dvlaResponse.make) {
    const typeApproval = dvlaResponse.typeApproval.toUpperCase();
    const make = dvlaResponse.make.toUpperCase();
    
    // If typeApproval contains the make, try to extract what comes after
    if (typeApproval.includes(make)) {
      const afterMake = typeApproval.substring(typeApproval.indexOf(make) + make.length).trim();
      if (afterMake && !afterMake.startsWith('*') && !afterMake.startsWith('-')) {
        inferredModel = afterMake.split(' ')[0]; // Take the first word after make as model
      }
    }
  }
  
  // For Citroen specifically, try to infer common models based on other data
  if (dvlaResponse.make?.toUpperCase() === 'CITROEN') {
    // Use engine capacity and year to make educated guesses
    if (dvlaResponse.engineCapacity) {
      const capacity = dvlaResponse.engineCapacity;
      const year = dvlaResponse.yearOfManufacture || 0;
      
      if (year >= 2014 && year <= 2018) {
        if (capacity >= 1500 && capacity <= 1600) {
          inferredModel = 'C4 Picasso'; // Common Citroen model for this period and engine size
        } else if (capacity >= 1100 && capacity <= 1200) {
          inferredModel = 'C3'; // Another common model
        } else if (capacity >= 1900 && capacity <= 2000) {
          inferredModel = 'C5'; // Larger engine model
        }
      }
    }
  }
  
  // Fallback to a generic model name if we couldn't infer anything
  const modelDisplay = inferredModel || (dvlaResponse.make ? 'Model' : 'Unknown Model');
  
  return {
    registration: dvlaResponse.registrationNumber,
    make: dvlaResponse.make || 'Unknown',
    model: modelDisplay,
    year: dvlaResponse.yearOfManufacture || new Date().getFullYear(),
    color: dvlaResponse.colour || 'Unknown',
    fuelType: dvlaResponse.fuelType || 'Unknown',
    motStatus,
    motExpiryDate: motExpiryDate ? motExpiryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    taxStatus,
    taxExpiryDate: taxExpiryDate ? taxExpiryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    mileage: 0, // DVLA API doesn't provide mileage information
    ownerId,
    specs: specs
  };
};

/**
 * Gets a user-friendly description of the MOT status
 */
export const getMotStatusDescription = (status: 'valid' | 'expired' | 'expiring_soon', expiryDate?: string): string => {
  switch (status) {
    case 'valid':
      return `Valid until ${expiryDate || 'unknown date'}`;
    case 'expired':
      return `Expired since ${expiryDate || 'unknown date'}`;
    case 'expiring_soon':
      return `Expiring soon on ${expiryDate || 'unknown date'}`;
    default:
      return 'Unknown status';
  }
};

/**
 * Gets a user-friendly description of the tax status
 */
export const getTaxStatusDescription = (status: 'valid' | 'expired' | 'expiring_soon', expiryDate?: string): string => {
  switch (status) {
    case 'valid':
      return `Valid until ${expiryDate || 'unknown date'}`;
    case 'expired':
      return `Expired since ${expiryDate || 'unknown date'}`;
    case 'expiring_soon':
      return `Due for renewal on ${expiryDate || 'unknown date'}`;
    default:
      return 'Unknown status';
  };
};
