import { Client, Account, Databases, Storage, Teams, ID, Query } from 'appwrite';

// Initialize Appwrite client
const client = new Client();

// Get environment variables
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || '';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const apiKey = import.meta.env.VITE_APPWRITE_API_KEY || '';

// Configure Appwrite client
client
  .setEndpoint(endpoint)
  .setProject(projectId);

// Set API key for server-side operations
if (apiKey) {
  // Note: API keys should only be used in a secure server environment
  // For client-side applications, use account sessions instead
  // This is included for development purposes only
  try {
    // @ts-ignore - Appwrite types may not be up to date
    client.setKey(apiKey);
  } catch (error) {
    console.error('Error setting API key:', error);
  }
}

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

// Database and collection IDs
export const DATABASE_ID = 'garagemunky';
export const USERS_COLLECTION_ID = 'users';
export const VEHICLES_COLLECTION_ID = 'vehicles';
export const APPOINTMENTS_COLLECTION_ID = 'appointments';
export const TRANSACTIONS_COLLECTION_ID = 'transactions';
export const MESSAGES_COLLECTION_ID = 'messages';
export const GARAGES_COLLECTION_ID = 'garages';
export const DIAGNOSTICS_COLLECTION_ID = 'diagnostics';

// Storage bucket IDs
export const VEHICLE_IMAGES_BUCKET_ID = 'vehicle_images';
export const GARAGE_IMAGES_BUCKET_ID = 'garage_images';
export const USER_AVATARS_BUCKET_ID = 'user_avatars';

// Team IDs
export const CAR_OWNERS_TEAM_ID = 'car_owners';
export const GARAGE_OPERATORS_TEAM_ID = 'garage_operators';
export const ADMINS_TEAM_ID = 'admins';

// Authentication methods
export const createAccount = async (email: string, password: string, name: string) => {
  try {
    // Let Appwrite handle the ID generation
    // This is the recommended approach according to Appwrite docs
    const response = await account.create(
      ID.unique(),
      email,
      password,
      name
    );
    
    if (response.$id) {
      // Create a session (login) using the correct method for v17.0.2
      await account.createEmailPasswordSession(email, password);
      return response;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  try {
    // Using the correct method for Appwrite SDK v17.0.2
    return await account.createEmailPasswordSession(email, password);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    return account.createOAuth2Session('google' as any, 
      window.location.origin + '/auth/callback', 
      window.location.origin + '/auth/failure'
    );
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
};

export const loginWithApple = async () => {
  try {
    return account.createOAuth2Session('apple' as any, 
      window.location.origin + '/auth/callback', 
      window.location.origin + '/auth/failure'
    );
  } catch (error) {
    console.error('Error logging in with Apple:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    return await account.deleteSession('current');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// User management
export const createUserProfile = async (userId: string, data: any) => {
  try {
    return await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      data
    );
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    return await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: any) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      data
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Vehicle management
export const createVehicle = async (data: any) => {
  try {
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
};

export const getVehicle = async (vehicleId: string) => {
  try {
    return await databases.getDocument(
      DATABASE_ID,
      VEHICLES_COLLECTION_ID,
      vehicleId
    );
  } catch (error) {
    console.error('Error getting vehicle:', error);
    return null;
  }
};

export const getUserVehicles = async (userId: string) => {
  try {
    return await databases.listDocuments(
      DATABASE_ID,
      VEHICLES_COLLECTION_ID,
      [
        // Query to find vehicles owned by the user
        Query.equal('ownerId', userId)
      ]
    );
  } catch (error) {
    console.error('Error getting user vehicles:', error);
    return { documents: [] };
  }
};

export const updateVehicle = async (vehicleId: string, data: any) => {
  try {
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
};

export const deleteVehicle = async (vehicleId: string) => {
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
};

// Appointment management
export const createAppointment = async (data: any) => {
  try {
    return await databases.createDocument(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      ID.unique(),
      data
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

export const getAppointment = async (appointmentId: string) => {
  try {
    return await databases.getDocument(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      appointmentId
    );
  } catch (error) {
    console.error('Error getting appointment:', error);
    return null;
  }
};

export const getUserAppointments = async (userId: string) => {
  try {
    return await databases.listDocuments(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      [
        Query.equal('userId', userId)
      ]
    );
  } catch (error) {
    console.error('Error getting user appointments:', error);
    return { documents: [] };
  }
};

export const getGarageAppointments = async (garageId: string) => {
  try {
    return await databases.listDocuments(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      [
        Query.equal('garageId', garageId)
      ]
    );
  } catch (error) {
    console.error('Error getting garage appointments:', error);
    return { documents: [] };
  }
};

export const updateAppointment = async (appointmentId: string, data: any) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      appointmentId,
      data
    );
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

export const deleteAppointment = async (appointmentId: string) => {
  try {
    return await databases.deleteDocument(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      appointmentId
    );
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

// Garage management
export const createGarage = async (data: any) => {
  try {
    return await databases.createDocument(
      DATABASE_ID,
      GARAGES_COLLECTION_ID,
      ID.unique(),
      data
    );
  } catch (error) {
    console.error('Error creating garage:', error);
    throw error;
  }
};

export const getGarage = async (garageId: string) => {
  try {
    return await databases.getDocument(
      DATABASE_ID,
      GARAGES_COLLECTION_ID,
      garageId
    );
  } catch (error) {
    console.error('Error getting garage:', error);
    return null;
  }
};

export const getNearbyGarages = async (lat: number, lng: number, radius: number = 10) => {
  try {
    // This is a simplified approach. In a real app, you'd use geospatial queries
    // or a specialized service for location-based searches
    const allGarages = await databases.listDocuments(
      DATABASE_ID,
      GARAGES_COLLECTION_ID
    );
    
    // Filter garages based on distance calculation
    // This is a simple example - you'd implement a more sophisticated approach in production
    const nearbyGarages = allGarages.documents.filter((garage: any) => {
      if (garage.coordinates && garage.coordinates.lat && garage.coordinates.lng) {
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          lat, 
          lng, 
          garage.coordinates.lat, 
          garage.coordinates.lng
        );
        
        return distance <= radius;
      }
      return false;
    });
    
    return { documents: nearbyGarages };
  } catch (error) {
    console.error('Error getting nearby garages:', error);
    return { documents: [] };
  }
};

// Helper function to calculate distance using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// File upload
export const uploadVehicleImage = async (file: File, vehicleId: string) => {
  try {
    const fileId = ID.unique();
    await storage.createFile(
      VEHICLE_IMAGES_BUCKET_ID,
      fileId,
      file
    );
    
    // Get file preview URL
    const fileUrl = storage.getFilePreview(
      VEHICLE_IMAGES_BUCKET_ID,
      fileId
    );
    
    // Update vehicle with image URL
    await updateVehicle(vehicleId, {
      image: fileUrl.toString()
    });
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading vehicle image:', error);
    throw error;
  }
};

export const uploadUserAvatar = async (file: File, userId: string) => {
  try {
    const fileId = ID.unique();
    await storage.createFile(
      USER_AVATARS_BUCKET_ID,
      fileId,
      file
    );
    
    // Get file preview URL
    const fileUrl = storage.getFilePreview(
      USER_AVATARS_BUCKET_ID,
      fileId
    );
    
    // Update user profile with avatar URL
    await updateUserProfile(userId, {
      avatar: fileUrl.toString()
    });
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading user avatar:', error);
    throw error;
  }
};

// Team management
export const assignUserToTeam = async (userId: string, teamId: string) => {
  try {
    // Using the correct method for Appwrite SDK v17.0.2
    return await teams.createMembership(
      teamId,
      {
        userId: userId,
        roles: ['member']
      }
    );
  } catch (error) {
    console.error('Error assigning user to team:', error);
    throw error;
  }
};

export const getUserTeams = async () => {
  try {
    return await teams.list();
  } catch (error) {
    console.error('Error getting user teams:', error);
    return { teams: [] };
  }
};

export default {
  client,
  account,
  databases,
  storage,
  teams,
  createAccount,
  login,
  loginWithGoogle,
  loginWithApple,
  logout,
  getCurrentUser,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  createVehicle,
  getVehicle,
  getUserVehicles,
  updateVehicle,
  deleteVehicle,
  createAppointment,
  getAppointment,
  getUserAppointments,
  getGarageAppointments,
  updateAppointment,
  deleteAppointment,
  createGarage,
  getGarage,
  getNearbyGarages,
  uploadVehicleImage,
  uploadUserAvatar,
  assignUserToTeam,
  getUserTeams
};
