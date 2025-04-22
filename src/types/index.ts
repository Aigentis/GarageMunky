
export type UserRole = 'car_owner' | 'garage_operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  location?: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  motStatus: 'valid' | 'expired' | 'expiring_soon';
  motExpiryDate: string;
  taxStatus: 'valid' | 'expired' | 'expiring_soon';
  taxExpiryDate: string;
  mileage: number;
  vin?: string;
  transmission?: string;
  drivetrain?: string;
  engine?: string;
  horsepower?: number;
  bodyType?: string;
  specs?: VehicleSpecs;
  image?: string;
  location?: string;
}

export interface VehicleSpecs {
  power?: string;
  consumption?: string;
  capacity?: string;
  seats?: number;
  features?: string[];
  engine?: {
    type: string;
    cylinders: number;
    displacement: number;
    fuelType: string;
    horsepower: number;
    torque: number;
  };
  transmission?: {
    type: string;
    speeds: number;
  };
  dimensions?: {
    doors: number;
    length?: number;
    width?: number;
    height?: number;
    wheelbase?: number;
  };
}

export interface GarageLocation {
  lat: number;
  lng: number;
}

export interface Garage {
  id: string;
  name: string;
  address: string;
  location: string;
  coordinates?: GarageLocation;
  rating: number;
  services: string[];
  openingHours: Record<string, string>;
  contactNumber: string;
  contactEmail: string;
  images?: string[];
}

export interface Appointment {
  id: string;
  vehicleId: string;
  garageId: string;
  userId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  serviceType: string;
  notes?: string;
  price?: number;
}

export interface DiagnosticSession {
  id: string;
  vehicleId: string;
  userId: string;
  createdAt: string;
  issue: string;
  symptoms: string[];
  suggestions: string[];
  recommendedAction: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid';

// DVLA API Response Types
export interface DVLAVehicleResponse {
  registrationNumber: string;
  taxStatus: string;
  taxDueDate: string;
  motStatus: string;
  motExpiryDate: string;
  make: string;
  yearOfManufacture: number;
  engineCapacity: number;
  co2Emissions: number;
  fuelType: string;
  markedForExport: boolean;
  colour: string;
  typeApproval: string;
  wheelplan: string;
  monthOfFirstRegistration: string;
  monthOfFirstDvlaRegistration: string;
  dateOfLastV5CIssued: string;
  euroStatus: string;
  realDrivingEmissions: string;
  revenueWeight: number;
}

export interface DVLAErrorResponse {
  httpStatus: number;
  errorMessage: string;
  errors?: Array<{
    status: string;
    code: string;
    title: string;
    detail: string;
  }>;
}

export interface DVLARequestBody {
  registrationNumber: string;
}
