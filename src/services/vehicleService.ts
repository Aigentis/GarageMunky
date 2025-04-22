import { ID } from 'appwrite';
import { 
  databases, 
  storage,
  DATABASE_ID, 
  VEHICLES_COLLECTION_ID,
  VEHICLE_IMAGES_BUCKET_ID
} from './appwrite';
import checkCarDetailsService from './checkCarDetailsService';
import dvlaService from './dvlaService';
import { Query } from 'appwrite';

// Vehicle interface
export interface Vehicle {
  id?: string;
  ownerId: string;
  registrationNumber: string;
  make?: string;
  model?: string;
  year?: string;
  colour?: string;
  fuelType?: string;
  engineCapacity?: string;
  motStatus?: string;
  motExpiryDate?: string;
  taxStatus?: string;
  taxExpiryDate?: string;
  mileage?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  images?: string[];
  dvlaData?: any;
  checkCarDetailsData?: any;
  createdAt?: string;
  updatedAt?: string;
}

class VehicleService {
  // Create a new vehicle
  async createVehicle(vehicleData: Vehicle): Promise<any> {
    try {
      const data = {
        ...vehicleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return await databases.createDocument(
        DATABASE_ID,
        VEHICLES_COLLECTION_ID,
        ID.unique(),
        data
      );
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // Get a vehicle by ID
  async getVehicle(vehicleId: string): Promise<any> {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        VEHICLES_COLLECTION_ID,
        vehicleId
      );
    } catch (error) {
      console.error('Error getting vehicle:', error);
      throw error;
    }
  }

  // Get all vehicles for a user
  async getUserVehicles(userId: string): Promise<any> {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        VEHICLES_COLLECTION_ID,
        [
          Query.equal('ownerId', userId)
        ]
      );
    } catch (error) {
      console.error('Error getting user vehicles:', error);
      return { documents: [] };
    }
  }

  // Update a vehicle
  async updateVehicle(vehicleId: string, vehicleData: Partial<Vehicle>): Promise<any> {
    try {
      const data = {
        ...vehicleData,
        updatedAt: new Date().toISOString()
      };
      
      return await databases.updateDocument(
        DATABASE_ID,
        VEHICLES_COLLECTION_ID,
        vehicleId,
        data
      );
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Delete a vehicle
  async deleteVehicle(vehicleId: string): Promise<any> {
    try {
      return await databases.deleteDocument(
        DATABASE_ID,
        VEHICLES_COLLECTION_ID,
        vehicleId
      );
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  // Upload a vehicle image
  async uploadVehicleImage(file: File, vehicleId: string): Promise<string> {
    try {
      const fileId = ID.unique();
      
      // Upload file to storage
      await storage.createFile(
        VEHICLE_IMAGES_BUCKET_ID,
        fileId,
        file
      );
      
      // Get file URL
      const fileUrl = storage.getFilePreview(
        VEHICLE_IMAGES_BUCKET_ID,
        fileId
      ).toString();
      
      // Get current vehicle
      const vehicle = await this.getVehicle(vehicleId);
      
      // Update vehicle images array
      const images = vehicle.images || [];
      images.push(fileUrl);
      
      // Update vehicle with new image
      await this.updateVehicle(vehicleId, { images });
      
      return fileUrl;
    } catch (error) {
      console.error('Error uploading vehicle image:', error);
      throw error;
    }
  }

  // Delete a vehicle image
  async deleteVehicleImage(fileId: string, vehicleId: string): Promise<void> {
    try {
      // Delete file from storage
      await storage.deleteFile(
        VEHICLE_IMAGES_BUCKET_ID,
        fileId
      );
      
      // Get current vehicle
      const vehicle = await this.getVehicle(vehicleId);
      
      // Update vehicle images array
      const fileUrl = storage.getFilePreview(
        VEHICLE_IMAGES_BUCKET_ID,
        fileId
      ).toString();
      
      const images = (vehicle.images || []).filter(
        (image: string) => image !== fileUrl
      );
      
      // Update vehicle with new images array
      await this.updateVehicle(vehicleId, { images });
    } catch (error) {
      console.error('Error deleting vehicle image:', error);
      throw error;
    }
  }

  // Add a vehicle with DVLA and CheckCarDetails data
  async addVehicleWithEnhancedData(
    userId: string, 
    registrationNumber: string, 
    additionalData: Partial<Vehicle> = {}
  ): Promise<any> {
    try {
      // Fetch DVLA data
      const dvlaData = await dvlaService.getVehicleDetails(registrationNumber);
      
      if (!dvlaData) {
        throw new Error('Could not fetch DVLA data for this vehicle');
      }
      
      // Extract relevant data from DVLA
      const vehicleData: Vehicle = {
        ownerId: userId,
        registrationNumber,
        make: dvlaData.make,
        model: dvlaData.model,
        year: dvlaData.yearOfManufacture?.toString(),
        colour: dvlaData.colour,
        fuelType: dvlaData.fuelType,
        engineCapacity: dvlaData.engineCapacity?.toString(),
        motStatus: dvlaData.motStatus,
        motExpiryDate: dvlaData.motExpiryDate,
        taxStatus: dvlaData.taxStatus,
        taxExpiryDate: dvlaData.taxDueDate,
        dvlaData,
        ...additionalData
      };
      
      // Create vehicle in database
      const newVehicle = await this.createVehicle(vehicleData);
      
      // Try to enhance with CheckCarDetails data (non-blocking)
      this.enhanceVehicleWithCheckCarDetails(newVehicle.$id, registrationNumber)
        .catch(error => console.error('Error enhancing vehicle with CheckCarDetails:', error));
      
      return newVehicle;
    } catch (error) {
      console.error('Error adding vehicle with enhanced data:', error);
      throw error;
    }
  }

  // Enhance an existing vehicle with CheckCarDetails data
  async enhanceVehicleWithCheckCarDetails(vehicleId: string, registrationNumber: string): Promise<any> {
    try {
      // Get vehicle specs
      const vehicleSpecs = await checkCarDetailsService.getVehicleSpecs(registrationNumber);
      
      // Get vehicle image
      const vehicleImage = await checkCarDetailsService.getVehicleImage(registrationNumber);
      
      // Get vehicle mileage history
      const mileageHistory = await checkCarDetailsService.getVehicleMileage(registrationNumber);
      
      // Combine all data
      const checkCarDetailsData = {
        specs: vehicleSpecs,
        image: vehicleImage,
        mileageHistory
      };
      
      // Update vehicle with CheckCarDetails data
      const images = [];
      if (vehicleImage && vehicleImage.imageUrl) {
        images.push(vehicleImage.imageUrl);
      }
      
      return await this.updateVehicle(vehicleId, {
        checkCarDetailsData,
        images: images.length > 0 ? images : undefined
      });
    } catch (error) {
      console.error('Error enhancing vehicle with CheckCarDetails:', error);
      throw error;
    }
  }
}

export const vehicleService = new VehicleService();
