
import { User, Vehicle, Garage, Appointment } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'Chris Johnson',
    email: 'chris@example.com',
    role: 'car_owner',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    location: 'London, UK'
  },
  {
    id: 'user2',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'car_owner',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    location: 'Manchester, UK'
  },
  {
    id: 'user3',
    name: 'Mike\'s Garage',
    email: 'mike@mikegarage.com',
    role: 'garage_operator',
    avatar: 'https://randomuser.me/api/portraits/men/59.jpg',
    location: 'Birmingham, UK'
  }
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle1',
    ownerId: 'user1',
    registration: 'AB12 CDE',
    make: 'Tesla',
    model: 'Model S',
    year: 2021,
    color: 'White',
    fuelType: 'Electric',
    motStatus: 'valid',
    motExpiryDate: '2024-12-15',
    taxStatus: 'valid',
    taxExpiryDate: '2024-10-01',
    mileage: 15000,
    image: '/lovable-uploads/fd1b4823-c0e5-48ab-ada8-d23bf81cb820.png',
    specs: {
      power: '155 mph',
      consumption: '100 kWh',
      capacity: '28 cubic feet',
      seats: 5,
      features: ['Premium audio system']
    }
  },
  {
    id: 'vehicle2',
    ownerId: 'user1',
    registration: 'XY21 ZAB',
    make: 'Range Rover',
    model: 'Sport',
    year: 2020,
    color: 'Black',
    fuelType: 'Petrol',
    motStatus: 'expiring_soon',
    motExpiryDate: '2024-05-20',
    taxStatus: 'valid',
    taxExpiryDate: '2024-11-10',
    mileage: 28000,
    specs: {
      power: '250 km/h',
      consumption: '8.9 L',
      capacity: '28 cubic feet',
      seats: 5,
      features: ['Leather seats', 'Panoramic sunroof']
    }
  },
  {
    id: 'vehicle3',
    ownerId: 'user2',
    registration: 'CD65 EFG',
    make: 'Chevrolet',
    model: 'Tahoe',
    year: 2019,
    color: 'Black',
    fuelType: 'Petrol',
    motStatus: 'expired',
    motExpiryDate: '2024-02-10',
    taxStatus: 'expiring_soon',
    taxExpiryDate: '2024-05-05',
    mileage: 45000,
    specs: {
      power: '220 km/h',
      consumption: '7.9 L',
      capacity: '35 cubic feet',
      seats: 7,
      features: ['Towing package', 'Heated seats']
    }
  }
];

// Mock Garages
export const mockGarages: Garage[] = [
  {
    id: 'garage1',
    name: 'Mike\'s Auto Repair',
    address: '123 High Street',
    location: 'Biscayne Boulevard',
    rating: 4.8,
    services: ['MOT Testing', 'Servicing', 'Repairs', 'Diagnostics'],
    openingHours: {
      monday: '8:00 - 18:00',
      tuesday: '8:00 - 18:00',
      wednesday: '8:00 - 18:00',
      thursday: '8:00 - 18:00',
      friday: '8:00 - 17:00',
      saturday: '9:00 - 14:00',
      sunday: 'Closed'
    },
    contactNumber: '01234 567890',
    contactEmail: 'info@mikesauto.com'
  },
  {
    id: 'garage2',
    name: 'Fast Fix Mechanics',
    address: '45 Bridge Road',
    location: 'Margaret Pace Park',
    rating: 4.5,
    services: ['MOT Testing', 'Servicing', 'Electrical Repairs', 'Tyre Fitting'],
    openingHours: {
      monday: '8:30 - 17:30',
      tuesday: '8:30 - 17:30',
      wednesday: '8:30 - 17:30',
      thursday: '8:30 - 17:30',
      friday: '8:30 - 17:30',
      saturday: '9:00 - 13:00',
      sunday: 'Closed'
    },
    contactNumber: '01234 987654',
    contactEmail: 'info@fastfix.com'
  },
  {
    id: 'garage3',
    name: 'Electric Vehicle Specialists',
    address: '78 Green Lane',
    location: 'Downtown Avenue',
    rating: 4.9,
    services: ['EV Repairs', 'Battery Servicing', 'Charging Solutions', 'Software Updates'],
    openingHours: {
      monday: '9:00 - 18:00',
      tuesday: '9:00 - 18:00',
      wednesday: '9:00 - 18:00',
      thursday: '9:00 - 18:00',
      friday: '9:00 - 18:00',
      saturday: '10:00 - 15:00',
      sunday: 'Closed'
    },
    contactNumber: '01234 123456',
    contactEmail: 'info@evspecialists.com'
  }
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: 'app1',
    vehicleId: 'vehicle1',
    garageId: 'garage3',
    userId: 'user1',
    date: '2024-05-10',
    time: '10:00',
    status: 'confirmed',
    serviceType: 'Annual Service',
    notes: 'Please check the battery health'
  },
  {
    id: 'app2',
    vehicleId: 'vehicle2',
    garageId: 'garage1',
    userId: 'user1',
    date: '2024-05-15',
    time: '14:30',
    status: 'pending',
    serviceType: 'MOT Test',
    notes: 'Vehicle has a strange noise when braking'
  },
  {
    id: 'app3',
    vehicleId: 'vehicle3',
    garageId: 'garage2',
    userId: 'user2',
    date: '2024-05-08',
    time: '09:15',
    status: 'completed',
    serviceType: 'Brake Repair',
    notes: 'Replaced front brake pads',
    price: 180
  }
];

// Default user for the demo
export const currentUser = mockUsers[0];
