// Import MOT Stations from CSV to Appwrite
import fs from 'fs';
import path from 'path';
import { Client, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

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

// Database and collection IDs
const DATABASE_ID = '6806df7e002e3f1efde9';
const GARAGES_COLLECTION_ID = 'garages';

// Check if the garages collection exists, if not create it
const ensureGaragesCollection = async () => {
  try {
    // Try to get the collection to see if it exists
    await databases.getCollection(DATABASE_ID, GARAGES_COLLECTION_ID);
    console.log(`Collection ${GARAGES_COLLECTION_ID} already exists.`);
    return true;
  } catch (error) {
    // If collection doesn't exist, create it
    if (error.code === 404) {
      try {
        console.log(`Creating collection ${GARAGES_COLLECTION_ID}...`);
        await databases.createCollection(DATABASE_ID, GARAGES_COLLECTION_ID, 'Garages');
        
        // Add attributes to Garages collection
        console.log('Adding attributes to Garages collection...');
        await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'name', 255, true);
        await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'address', 500, true);
        await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'address1', 255, false);
        await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'address2', 255, false);
        await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'address3', 255, false);
        await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'town', 100, false);
        await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'postcode', 20, true);
        await databases.createStringAttribute(DATABASE_ID, GARAGES_COLLECTION_ID, 'phone', 20, false);
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
        console.log('Creating indexes for Garages collection...');
        // Wait for attributes to be ready before creating indexes
        console.log('Waiting for attributes to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
          await databases.createIndex(
            DATABASE_ID, 
            GARAGES_COLLECTION_ID, 
            'postcode_index', 
            'key', 
            ['postcode']
          );
          console.log('Created postcode index');
          
          await databases.createIndex(
            DATABASE_ID, 
            GARAGES_COLLECTION_ID, 
            'owner_index', 
            'key', 
            ['ownerId']
          );
          console.log('Created owner index');
          
          await databases.createIndex(
            DATABASE_ID, 
            GARAGES_COLLECTION_ID, 
            'site_number_index', 
            'key', 
            ['siteNumber'],
            true
          );
          console.log('Created site number index');
        } catch (indexError) {
          console.error('Error creating indexes:', indexError);
          // Continue even if index creation fails
        }
        
        console.log('Collection created successfully!');
        return true;
      } catch (createError) {
        console.error('Error creating collection:', createError);
        return false;
      }
    } else {
      console.error('Error checking if collection exists:', error);
      return false;
    }
  }
};

// Parse CSV data into MOT station objects
const parseMotStationsCsv = (csvData) => {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const station = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      
      if (header === 'Site_Number') {
        station.siteNumber = value;
      } else if (header === 'Trading_Name') {
        station.name = value;
      } else if (header === 'Address1') {
        station.address1 = value;
      } else if (header === 'Address2') {
        station.address2 = value;
      } else if (header === 'Address3') {
        station.address3 = value;
      } else if (header === 'Town') {
        station.town = value;
      } else if (header === 'Postcode') {
        station.postcode = value;
      } else if (header === 'Phone') {
        station.phone = value;
      } else if (header.startsWith('Class_')) {
        // Convert Y/N to boolean
        station[header.toLowerCase().replace('_', '')] = value === 'Y';
      }
    });
    
    // Format full address
    const addressParts = [
      station.address1,
      station.address2,
      station.address3,
      station.town,
      station.postcode
    ].filter(part => part && part.trim());
    
    station.address = addressParts.join(', ');
    
    return station;
  });
};

// Import MOT stations to Appwrite database
const importMotStationsToAppwrite = async (stations) => {
  try {
    // First ensure the garages collection exists
    const collectionExists = await ensureGaragesCollection();
    if (!collectionExists) {
      console.error('Failed to ensure garages collection exists. Import aborted.');
      return false;
    }
    
    console.log(`Importing ${stations.length} MOT stations to Appwrite...`);
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 20;
    const batches = Math.ceil(stations.length / batchSize);
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, stations.length);
      const batch = stations.slice(start, end);
      
      console.log(`Processing batch ${i + 1}/${batches} (${batch.length} stations)...`);
      
      // Process each station in the batch
      for (const station of batch) {
        try {
          // Check if the station already exists
          try {
            const existingGarages = await databases.listDocuments(
              DATABASE_ID,
              GARAGES_COLLECTION_ID,
              [
                Query.equal('siteNumber', station.siteNumber)
              ]
            );
            
            if (existingGarages.documents.length > 0) {
              console.log(`Station ${station.siteNumber} already exists, skipping...`);
              skippedCount++;
              continue;
            }
          } catch (listError) {
            console.error(`Error checking if station ${station.siteNumber} exists:`, listError);
            // Continue with import attempt even if check fails
          }
          
          // Create a new garage document
          await databases.createDocument(
            DATABASE_ID,
            GARAGES_COLLECTION_ID,
            ID.unique(),
            {
              siteNumber: station.siteNumber,
              name: station.name,
              address: station.address,
              address1: station.address1 || '',
              address2: station.address2 || '',
              address3: station.address3 || '',
              town: station.town || '',
              postcode: station.postcode || '',
              phone: station.phone || '',
              class1: station.class1 || false,
              class2: station.class2 || false,
              class3: station.class3 || false,
              class4: station.class4 || false,
              class5: station.class5 || false,
              class7: station.class7 || false,
              claimed: false,
              ownerId: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          );
          
          console.log(`Created garage: ${station.name} (${station.siteNumber})`);
          importedCount++;
        } catch (error) {
          console.error(`Error creating garage ${station.siteNumber}:`, error);
          errorCount++;
        }
      }
    }
    
    console.log('Import summary:');
    console.log(`- Total stations: ${stations.length}`);
    console.log(`- Imported: ${importedCount}`);
    console.log(`- Skipped (already exist): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log('Import completed!');
    return true;
  } catch (error) {
    console.error('Error importing MOT stations:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  try {
    // Read the CSV file
    const csvPath = path.join(__dirname, '../public/active-mot-stations.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    // Parse the CSV data
    const stations = parseMotStationsCsv(csvData);
    console.log(`Parsed ${stations.length} MOT stations from CSV`);
    
    // Limit the number of stations for testing if needed
    // const limitedStations = stations.slice(0, 10); // Uncomment to test with just 10 stations
    
    // Import to Appwrite
    const success = await importMotStationsToAppwrite(stations);
    
    if (success) {
      console.log('Import process completed successfully!');
    } else {
      console.error('Import process completed with errors.');
    }
  } catch (error) {
    console.error('Error in import process:', error);
  }
};

// Run the import
main();
