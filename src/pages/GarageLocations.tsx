
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GarageMapView from "../components/GarageMapView";
import NavBar from "../components/NavBar";
import { Garage } from "../types";

// Mock garages data
const mockGarages: Garage[] = [
  { 
    id: "g1", 
    name: "Mike's Auto Repair", 
    address: "123 Main Street, Miami, FL 33139",
    location: "Miami, Florida", 
    rating: 4.8,
    services: ["MOT", "Repairs", "Service"],
    openingHours: {
      "Monday": "8:00 AM - 6:00 PM",
      "Tuesday": "8:00 AM - 6:00 PM",
      "Wednesday": "8:00 AM - 6:00 PM",
      "Thursday": "8:00 AM - 6:00 PM",
      "Friday": "8:00 AM - 5:00 PM",
      "Saturday": "9:00 AM - 2:00 PM",
      "Sunday": "Closed"
    },
    contactNumber: "305-555-1234",
    contactEmail: "info@mikesauto.example.com",
    images: ["/placeholder.svg"]
  },
  { 
    id: "g2", 
    name: "Fast Fix Mechanics", 
    address: "456 Ocean Drive, Miami, FL 33139",
    location: "Miami Beach, Florida", 
    rating: 4.5,
    services: ["MOT", "Tyres", "Electrical"],
    openingHours: {
      "Monday": "7:30 AM - 7:00 PM",
      "Tuesday": "7:30 AM - 7:00 PM",
      "Wednesday": "7:30 AM - 7:00 PM",
      "Thursday": "7:30 AM - 7:00 PM",
      "Friday": "7:30 AM - 7:00 PM",
      "Saturday": "8:00 AM - 4:00 PM",
      "Sunday": "Closed"
    },
    contactNumber: "305-555-5678",
    contactEmail: "contact@fastfix.example.com",
    images: ["/placeholder.svg"]
  },
  { 
    id: "g3", 
    name: "Premium Auto Care", 
    address: "789 Brickell Ave, Miami, FL 33131",
    location: "Brickell, Miami", 
    rating: 4.7,
    services: ["Repairs", "Detailing", "Diagnostics"],
    openingHours: {
      "Monday": "9:00 AM - 6:00 PM",
      "Tuesday": "9:00 AM - 6:00 PM",
      "Wednesday": "9:00 AM - 6:00 PM",
      "Thursday": "9:00 AM - 6:00 PM",
      "Friday": "9:00 AM - 6:00 PM",
      "Saturday": "10:00 AM - 3:00 PM",
      "Sunday": "Closed"
    },
    contactNumber: "305-555-9012",
    contactEmail: "service@premiumauto.example.com",
    images: ["/placeholder.svg"]
  },
  { 
    id: "g4", 
    name: "Elite Motors Service", 
    address: "234 Coral Way, Miami, FL 33145",
    location: "Coral Way, Miami", 
    rating: 4.6,
    services: ["Full Service", "Body Work", "Electrical"],
    openingHours: {
      "Monday": "8:00 AM - 6:00 PM",
      "Tuesday": "8:00 AM - 6:00 PM",
      "Wednesday": "8:00 AM - 6:00 PM",
      "Thursday": "8:00 AM - 6:00 PM",
      "Friday": "8:00 AM - 6:00 PM",
      "Saturday": "9:00 AM - 2:00 PM",
      "Sunday": "Closed"
    },
    contactNumber: "305-555-3456",
    contactEmail: "info@elitemotors.example.com",
    images: ["/placeholder.svg"]
  }
];

const GarageLocations = () => {
  const navigate = useNavigate();
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  
  const handleGarageSelect = (garage: Garage) => {
    setSelectedGarage(garage);
  };
  
  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-white p-4">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Garage Locations</h1>
        </div>
        <p className="text-gray-600 mt-1">
          Find garages nearby for your vehicle maintenance needs
        </p>
      </header>
      
      {/* Map Container */}
      <div className="p-4">
        <GarageMapView 
          garages={mockGarages}
          height="500px"
          onGarageSelect={handleGarageSelect}
        />
      </div>
      
      {/* Selected Garage Details */}
      {selectedGarage && (
        <div className="px-4 mt-2">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg">{selectedGarage.name}</h2>
                <p className="text-gray-600 text-sm">{selectedGarage.address}</p>
                <div className="flex items-center mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-sm ml-1">{selectedGarage.rating}</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/bookings/new?garageId=${selectedGarage.id}`)}
                className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm"
              >
                Book Now
              </button>
            </div>
            
            <div className="mt-3">
              <h3 className="font-medium text-sm mb-1">Services</h3>
              <div className="flex flex-wrap gap-1">
                {selectedGarage.services.map((service, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-3 flex space-x-3">
              <a 
                href={`tel:${selectedGarage.contactNumber}`}
                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm text-center"
              >
                Call
              </a>
              <a 
                href={`mailto:${selectedGarage.contactEmail}`}
                className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-sm text-center"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      )}
      
      <NavBar />
    </div>
  );
};

export default GarageLocations;
