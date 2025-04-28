import { ID, Query } from 'appwrite';
import appwriteService, { 
  DATABASE_ID, 
  GARAGES_COLLECTION_ID 
} from '../services/appwrite';

export interface MOTStation {
  siteNumber: string;
  tradingName: string;
  address1: string;
  address2: string;
  address3: string;
  town: string;
  postcode: string;
  phone: string;
  class1: boolean;
  class2: boolean;
  class3: boolean;
  class4: boolean;
  class5: boolean;
  class7: boolean;
}

// Parse CSV data into MOTStation objects
export const parseMotStationsCsv = (csvData: string): MOTStation[] => {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const station: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      
      if (header === 'Site_Number') {
        station.siteNumber = value;
      } else if (header === 'Trading_Name') {
        station.tradingName = value;
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
    
    return station as MOTStation;
  });
};

// Import MOT stations to Appwrite database
export const importMotStationsToAppwrite = async (stations: MOTStation[]) => {
  try {
    console.log(`Importing ${stations.length} MOT stations to Appwrite...`);
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 20;
    const batches = Math.ceil(stations.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, stations.length);
      const batch = stations.slice(start, end);
      
      console.log(`Processing batch ${i + 1}/${batches} (${batch.length} stations)...`);
      
      // Process each station in the batch
      await Promise.all(batch.map(async (station) => {
        try {
          // Check if the station already exists
          const existingGarages = await appwriteService.databases.listDocuments(
            DATABASE_ID,
            GARAGES_COLLECTION_ID,
            [
              Query.equal('siteNumber', station.siteNumber)
            ]
          );
          
          if (existingGarages.documents.length > 0) {
            console.log(`Station ${station.siteNumber} already exists, skipping...`);
            return;
          }
          
          // Create a new garage document
          await appwriteService.databases.createDocument(
            DATABASE_ID,
            GARAGES_COLLECTION_ID,
            ID.unique(),
            {
              siteNumber: station.siteNumber,
              name: station.tradingName,
              address: formatAddress(station),
              address1: station.address1,
              address2: station.address2,
              address3: station.address3,
              town: station.town,
              postcode: station.postcode,
              phone: station.phone,
              class1: station.class1,
              class2: station.class2,
              class3: station.class3,
              class4: station.class4,
              class5: station.class5,
              class7: station.class7,
              claimed: false,
              ownerId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          );
          
          console.log(`Created garage: ${station.tradingName} (${station.siteNumber})`);
        } catch (error) {
          console.error(`Error creating garage ${station.siteNumber}:`, error);
        }
      }));
    }
    
    console.log('Import completed successfully!');
    return true;
  } catch (error) {
    console.error('Error importing MOT stations:', error);
    return false;
  }
};

// Format address from MOT station data
export const formatAddress = (station: MOTStation): string => {
  const parts = [
    station.address1,
    station.address2,
    station.address3,
    station.town,
    station.postcode
  ].filter(part => part && part.trim());
  
  return parts.join(', ');
};

// Get garages by postcode
export const getGaragesByPostcode = async (postcode: string) => {
  try {
    // First, try to find exact matches
    const exactMatches = await appwriteService.databases.listDocuments(
      DATABASE_ID,
      GARAGES_COLLECTION_ID,
      [
        Query.equal('postcode', postcode.toUpperCase())
      ]
    );
    
    if (exactMatches.documents.length > 0) {
      return exactMatches.documents;
    }
    
    // If no exact matches, try to find partial matches
    // This is a simplified approach - in a real app, you'd use a postcode API
    // to get nearby postcodes based on distance
    const partialMatches = await appwriteService.databases.listDocuments(
      DATABASE_ID,
      GARAGES_COLLECTION_ID,
      [
        Query.search('postcode', postcode.substring(0, 3).toUpperCase())
      ]
    );
    
    return partialMatches.documents;
  } catch (error) {
    console.error('Error getting garages by postcode:', error);
    return [];
  }
};

// Verify garage ownership using site number
export const verifyGarageOwnership = async (siteNumber: string, verificationCode: string) => {
  try {
    // In a real app, you'd validate the verification code against some external source
    // For now, we'll just check if the site number matches
    if (siteNumber === verificationCode) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying garage ownership:', error);
    return false;
  }
};
