
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Search, Car } from "lucide-react";
import { format } from "date-fns";
import NavBar from "../components/NavBar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useVehicles } from "../contexts/VehicleContext";

// Mock time slots
const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM"
];

// Mock service types
const serviceTypes = [
  { id: "s1", name: "Oil Change", price: 49.99, duration: "30 min" },
  { id: "s2", name: "Tire Rotation", price: 39.99, duration: "45 min" },
  { id: "s3", name: "Full Service", price: 199.99, duration: "3 hours" },
  { id: "s4", name: "Brake Inspection", price: 79.99, duration: "1 hour" },
  { id: "s5", name: "Battery Replacement", price: 129.99, duration: "30 min" }
];

// Mock garages
const garages = [
  { 
    id: "g1", 
    name: "Mike's Auto Repair", 
    address: "123 Main Street, Miami, FL 33139", 
    rating: 4.8,
    image: "/placeholder.svg"
  },
  { 
    id: "g2", 
    name: "Fast Fix Mechanics", 
    address: "456 Ocean Drive, Miami, FL 33139", 
    rating: 4.5,
    image: "/placeholder.svg"
  },
  { 
    id: "g3", 
    name: "Premium Auto Care", 
    address: "789 Brickell Ave, Miami, FL 33131", 
    rating: 4.7,
    image: "/placeholder.svg"
  }
];

const NewBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userVehicles } = useVehicles();
  
  // Booking state
  const [step, setStep] = useState(1);
  const [selectedGarage, setSelectedGarage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter garages based on search
  const filteredGarages = searchQuery 
    ? garages.filter(garage => 
        garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        garage.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : garages;
    
  // Get selected garage details
  const garageDetails = garages.find(g => g.id === selectedGarage);
  
  // Get selected service details
  const serviceDetails = serviceTypes.find(s => s.id === selectedService);
  
  // Get selected vehicle details
  const vehicleDetails = userVehicles.find(v => v.id === selectedVehicle);
  
  // Handle form submission
  const handleSubmit = () => {
    // Check if all required fields are selected
    if (!selectedGarage || !selectedDate || !selectedTime || !selectedService || !selectedVehicle) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields to book your appointment.",
      });
      return;
    }
    
    // Simulate API call
    toast({
      title: "Booking Successful!",
      description: "Your appointment has been scheduled.",
    });
    
    // Navigate to bookings list
    navigate("/bookings");
  };
  
  // Render appropriate step content
  const renderStepContent = () => {
    switch(step) {
      case 1: // Select Garage
        return (
          <>
            <h2 className="font-semibold text-lg mb-3">Select a Garage</h2>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name or location"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredGarages.map(garage => (
                <div
                  key={garage.id}
                  className={`border rounded-xl p-4 cursor-pointer ${
                    selectedGarage === garage.id 
                      ? "border-primary bg-primary/5" 
                      : "border-gray-100"
                  }`}
                  onClick={() => setSelectedGarage(garage.id)}
                >
                  <div className="flex">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mr-3 flex-shrink-0 overflow-hidden">
                      <img 
                        src={garage.image} 
                        alt={garage.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{garage.name}</h3>
                      <p className="text-sm text-gray-600">{garage.address}</p>
                      <div className="flex items-center mt-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-xs ml-1">{garage.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredGarages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No garages found matching your search.</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedGarage}
              >
                Continue
              </Button>
            </div>
          </>
        );
      
      case 2: // Select Date & Time
        return (
          <>
            <h2 className="font-semibold text-lg mb-3">Select Date & Time</h2>
            
            {/* Date selection */}
            <div className="mb-6">
              <Label className="block mb-2">Select a Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => 
                      date < new Date() || // No past dates
                      date.getDay() === 0 // No Sundays
                    }
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Time selection */}
            {selectedDate && (
              <div>
                <Label className="block mb-2">Select a Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      className="justify-center"
                      onClick={() => setSelectedTime(time)}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
              >
                Continue
              </Button>
            </div>
          </>
        );
      
      case 3: // Select Service & Vehicle
        return (
          <>
            <h2 className="font-semibold text-lg mb-3">Select Service & Vehicle</h2>
            
            {/* Service selection */}
            <div className="mb-6">
              <Label className="block mb-2">Select a Service</Label>
              <div className="space-y-2">
                {serviceTypes.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-3 cursor-pointer ${
                      selectedService === service.id 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium">{service.name}</h3>
                      <span className="font-medium">${service.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-600">Duration: {service.duration}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Vehicle selection */}
            <div className="mb-6">
              <Label className="block mb-2">Select Your Vehicle</Label>
              {userVehicles.length > 0 ? (
                <div className="space-y-2">
                  {userVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`border rounded-lg p-3 cursor-pointer ${
                        selectedVehicle === vehicle.id 
                          ? "border-primary bg-primary/5" 
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex">
                        <div className="w-12 h-12 bg-gray-100 rounded-md mr-3 flex-shrink-0 overflow-hidden">
                          {vehicle.image ? (
                            <img 
                              src={vehicle.image} 
                              alt={`${vehicle.make} ${vehicle.model}`} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                          <p className="text-sm text-gray-600">{vehicle.registration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <Car size={32} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-600">No vehicles added yet</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => navigate("/vehicles/add")}
                  >
                    Add a Vehicle
                  </Button>
                </div>
              )}
            </div>
            
            {/* Notes */}
            <div className="mb-6">
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <textarea
                id="notes"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="E.g., specific issues, preferences, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedService || !selectedVehicle}
              >
                Book Appointment
              </Button>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-white p-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/bookings")}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Book an Appointment</h1>
        </div>
      </header>
      
      {/* Steps progress */}
      <div className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-gray-200"
            }`}>
              1
            </div>
            <div className={`h-1 w-5 ${step > 1 ? "bg-primary" : "bg-gray-200"}`}></div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-gray-200"
            }`}>
              2
            </div>
            <div className={`h-1 w-5 ${step > 2 ? "bg-primary" : "bg-gray-200"}`}></div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              step >= 3 ? "bg-primary text-primary-foreground" : "bg-gray-200"
            }`}>
              3
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Step {step} of 3
          </div>
        </div>
      </div>
      
      {/* Form content */}
      <div className="p-4">
        {renderStepContent()}
      </div>
      
      {/* Booking summary (visible on steps 2 & 3) */}
      {step > 1 && garageDetails && (
        <div className="px-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="font-medium mb-2">Booking Summary</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Garage:</span>
                <span>{garageDetails.name}</span>
              </div>
              
              {selectedDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{format(selectedDate, "PPP")}</span>
                </div>
              )}
              
              {selectedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span>{selectedTime}</span>
                </div>
              )}
              
              {serviceDetails && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span>{serviceDetails.name} (${serviceDetails.price.toFixed(2)})</span>
                </div>
              )}
              
              {vehicleDetails && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle:</span>
                  <span>{vehicleDetails.year} {vehicleDetails.make} {vehicleDetails.model}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <NavBar />
    </div>
  );
};

export default NewBooking;
