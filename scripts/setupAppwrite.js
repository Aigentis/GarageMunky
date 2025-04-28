// Setup Appwrite collections and indexes
import { Client, Databases, ID, Permission, Role, Teams } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize dotenv
dotenv.config();

// Get current file directory (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Appwrite configuration
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const teams = new Teams(client);

// Database and collection IDs
const DATABASE_ID = '6806df7e002e3f1efde9';
const USERS_COLLECTION_ID = 'users';
const VEHICLES_COLLECTION_ID = 'vehicles';
const APPOINTMENTS_COLLECTION_ID = 'appointments';
const TRANSACTIONS_COLLECTION_ID = 'transactions';
const MESSAGES_COLLECTION_ID = 'messages';
const GARAGES_COLLECTION_ID = 'garages';
const DIAGNOSTICS_COLLECTION_ID = 'diagnostics';

// Team IDs
const CAR_OWNERS_TEAM_ID = 'car_owners';
const GARAGE_OPERATORS_TEAM_ID = 'garage_operators';
const ADMINS_TEAM_ID = 'admins';

// Create collections if they don't exist
const setupCollections = async () => {
  try {
    console.log('Setting up Appwrite collections...');
    
    // Check if database exists
    try {
      await databases.get(DATABASE_ID);
      console.log(`Database ${DATABASE_ID} already exists.`);
    } catch (error) {
      console.log(`Creating database ${DATABASE_ID}...`);
      await databases.create(DATABASE_ID, 'GarageMunky Database');
    }
    
    // Create Users collection
    try {
      await databases.getCollection(DATABASE_ID, USERS_COLLECTION_ID);
      console.log(`Collection ${USERS_COLLECTION_ID} already exists.`);
    } catch (error) {
      console.log(`Creating collection ${USERS_COLLECTION_ID}...`);
      await databases.createCollection(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        'Users'
      );
      
      // Add attributes to Users collection
      await databases.createStringAttribute(DATABASE_ID, USERS_COLLECTION_ID, 'name', 255, true);
      await databases.createStringAttribute(DATABASE_ID, USERS_COLLECTION_ID, 'email', 255, true);
      await databases.createStringAttribute(DATABASE_ID, USERS_COLLECTION_ID, 'role', 50, true);
      await databases.createStringAttribute(DATABASE_ID, USERS_COLLECTION_ID, 'avatar', 255, false);
      await databases.createStringAttribute(DATABASE_ID, USERS_COLLECTION_ID, 'phone', 20, false);
      await databases.createStringAttribute(DATABASE_ID, USERS_COLLECTION_ID, 'createdAt', 30, false);
      await databases.createStringAttribute(DATABASE_ID, USERS_COLLECTION_ID, 'updatedAt', 30, false);
      
      // Create indexes
      await databases.createIndex(DATABASE_ID, USERS_COLLECTION_ID, 'email_index', 'key', ['email'], true);
    }
    
    // Create Vehicles collection
    try {
      await databases.getCollection(DATABASE_ID, VEHICLES_COLLECTION_ID);
      console.log(`Collection ${VEHICLES_COLLECTION_ID} already exists.`);
    } catch (error) {
      console.log(`Creating collection ${VEHICLES_COLLECTION_ID}...`);
      await databases.createCollection(
        DATABASE_ID,
        VEHICLES_COLLECTION_ID,
        'Vehicles'
      );
      
      // Add attributes to Vehicles collection
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'registration', 20, true);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'make', 100, true);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'model', 100, true);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'year', 10, false);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'color', 50, false);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'fuelType', 50, false);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'motStatus', 20, false);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'motExpiryDate', 30, false);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'taxStatus', 20, false);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'taxExpiryDate', 30, false);
      await databases.createIntegerAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'mileage', false);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'image', 255, false);
      await databases.createStringAttribute(DATABASE_ID, VEHICLES_COLLECTION_ID, 'ownerId', 36, true);
      
      // Create indexes
      await databases.createIndex(DATABASE_ID, VEHICLES_COLLECTION_ID, 'registration_index', 'key', ['registration'], true);
      await databases.createIndex(DATABASE_ID, VEHICLES_COLLECTION_ID, 'owner_index', 'key', ['ownerId'], false);
    }
    
    // Create Garages collection
    try {
      await databases.getCollection(DATABASE_ID, GARAGES_COLLECTION_ID);
      console.log(`Collection ${GARAGES_COLLECTION_ID} already exists.`);
    } catch (error) {
      console.log(`Creating collection ${GARAGES_COLLECTION_ID}...`);
      await databases.createCollection(
        DATABASE_ID,
        GARAGES_COLLECTION_ID,
        'Garages'
      );
      
      // Add attributes to Garages collection
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'name', 255, true);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'address', 500, true);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'address1', 255, false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'address2', 255, false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'address3', 255, false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'town', 100, false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'postcode', 20, true);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'phone', 20, false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'email', 255, false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'siteNumber', 20, false);
      await databases.createBooleanAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'claimed', false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'ownerId', 36, false);
      await databases.createBooleanAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'class1', false);
      await databases.createBooleanAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'class2', false);
      await databases.createBooleanAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'class3', false);
      await databases.createBooleanAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'class4', false);
      await databases.createBooleanAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'class5', false);
      await databases.createBooleanAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'class7', false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'createdAt', 30, false);
      await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'updatedAt', 30, false);
      
      // Create indexes
      await databases.createIndex(DATABASE_ID, GARAGES_COLLECTION_ID, 'postcode_index', 'key', ['postcode'], false);
      await databases.createIndex(DATABASE_ID, GARAGES_COLLECTION_ID, 'owner_index', 'key', ['ownerId'], false);
      await databases.createIndex(DATABASE_ID, GARAGES_COLLECTION_ID, 'site_number_index', 'key', ['siteNumber'], true);
    }
    
    // Create Appointments collection
    try {
      await databases.getCollection(DATABASE_ID, APPOINTMENTS_COLLECTION_ID);
      console.log(`Collection ${APPOINTMENTS_COLLECTION_ID} already exists.`);
    } catch (error) {
      console.log(`Creating collection ${APPOINTMENTS_COLLECTION_ID}...`);
      await databases.createCollection(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        'Appointments'
      );
      
      // Add attributes to Appointments collection
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'userId', 36, true);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'vehicleId', 36, true);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'garageId', 36, true);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'date', 30, true);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'time', 30, true);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'status', 20, true);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'type', 50, true);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'notes', 1000, false);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'createdAt', 30, false);
      await databases.createStringAttribute(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'updatedAt', 30, false);
      
      // Create indexes
      await databases.createIndex(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'user_index', 'key', ['userId'], false);
      await databases.createIndex(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'vehicle_index', 'key', ['vehicleId'], false);
      await databases.createIndex(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'garage_index', 'key', ['garageId'], false);
      await databases.createIndex(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, 'date_index', 'key', ['date'], false);
    }
    
    // Create Teams if they don't exist
    try {
      await teams.get(CAR_OWNERS_TEAM_ID);
      console.log(`Team ${CAR_OWNERS_TEAM_ID} already exists.`);
    } catch (error) {
      console.log(`Creating team ${CAR_OWNERS_TEAM_ID}...`);
      await teams.create(CAR_OWNERS_TEAM_ID, 'Car Owners');
    }
    
    try {
      await teams.get(GARAGE_OPERATORS_TEAM_ID);
      console.log(`Team ${GARAGE_OPERATORS_TEAM_ID} already exists.`);
    } catch (error) {
      console.log(`Creating team ${GARAGE_OPERATORS_TEAM_ID}...`);
      await teams.create(GARAGE_OPERATORS_TEAM_ID, 'Garage Operators');
    }
    
    try {
      await teams.get(ADMINS_TEAM_ID);
      console.log(`Team ${ADMINS_TEAM_ID} already exists.`);
    } catch (error) {
      console.log(`Creating team ${ADMINS_TEAM_ID}...`);
      await teams.create(ADMINS_TEAM_ID, 'Administrators');
    }
    
    console.log('Appwrite setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Appwrite:', error);
  }
};

// Run the setup
setupCollections();
