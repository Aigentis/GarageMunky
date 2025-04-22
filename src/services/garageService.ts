import { toast } from 'sonner';

export interface Garage {
  id: string;
  name: string;
  address: string;
  distance: number; // in miles or km
  rating: number;
  services: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  phone?: string;
  website?: string;
  openingHours?: {
    [key: string]: string;
  };
}

// Mock data for garages
const mockGarages: Garage[] = [
  {
    id: 'garage1',
    name: 'AutoFix Garage',
    address: '123 Main Street, London',
    distance: 0.5,
    rating: 4.7,
    services: ['MOT', 'Service', 'Repairs', 'Diagnostics'],
    coordinates: {
      lat: 51.5074,
      lng: -0.1278
    },
    phone: '020 1234 5678',
    website: 'https://autofix.example.com',
    openingHours: {
      'Monday': '8:00 - 18:00',
      'Tuesday': '8:00 - 18:00',
      'Wednesday': '8:00 - 18:00',
      'Thursday': '8:00 - 18:00',
      'Friday': '8:00 - 18:00',
      'Saturday': '9:00 - 16:00',
      'Sunday': 'Closed'
    }
  },
  {
    id: 'garage2',
    name: 'QuickService Motors',
    address: '456 High Street, London',
    distance: 1.2,
    rating: 4.5,
    services: ['MOT', 'Service', 'Tyres', 'Air Conditioning'],
    coordinates: {
      lat: 51.5173,
      lng: -0.1269
    },
    phone: '020 9876 5432',
    website: 'https://quickservice.example.com',
    openingHours: {
      'Monday': '7:30 - 19:00',
      'Tuesday': '7:30 - 19:00',
      'Wednesday': '7:30 - 19:00',
      'Thursday': '7:30 - 19:00',
      'Friday': '7:30 - 19:00',
      'Saturday': '8:00 - 17:00',
      'Sunday': '10:00 - 16:00'
    }
  },
  {
    id: 'garage3',
    name: 'Premium Auto Care',
    address: '789 Park Lane, London',
    distance: 2.3,
    rating: 4.9,
    services: ['MOT', 'Service', 'Repairs', 'Bodywork', 'Detailing'],
    coordinates: {
      lat: 51.5098,
      lng: -0.1340
    },
    phone: '020 5555 7777',
    website: 'https://premiumauto.example.com',
    openingHours: {
      'Monday': '8:00 - 20:00',
      'Tuesday': '8:00 - 20:00',
      'Wednesday': '8:00 - 20:00',
      'Thursday': '8:00 - 20:00',
      'Friday': '8:00 - 20:00',
      'Saturday': '9:00 - 18:00',
      'Sunday': 'Closed'
    }
  }
];

// Function to get the user's current location
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => resolve(position),
      error => {
        toast.error(`Error getting location: ${error.message}`);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

// Calculate distance between two coordinates using the Haversine formula
const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

// Function to get nearby garages based on user location
export const getNearbyGarages = async (maxDistance: number = 5): Promise<Garage[]> => {
  try {
    // In a real app, this would call an API with the user's location
    // For now, we'll use the mock data and filter based on the user's location
    
    const position = await getCurrentLocation();
    const { latitude, longitude } = position.coords;
    
    // Filter garages based on distance from user
    const garagesWithDistance = mockGarages.map(garage => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        garage.coordinates.lat, 
        garage.coordinates.lng
      );
      
      return {
        ...garage,
        distance: parseFloat(distance.toFixed(1))
      };
    });
    
    // Sort by distance and filter by max distance
    return garagesWithDistance
      .filter(garage => garage.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
      
  } catch (error) {
    console.error('Error fetching nearby garages:', error);
    // Return mock data if location access fails
    return mockGarages;
  }
};
