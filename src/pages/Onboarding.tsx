import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from "../types";
import { useUser } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import { useVehicles } from "../contexts/VehicleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRegistration } from "../utils/vehicleUtils";
import UKNumberPlate from "@/components/vehicle/UKNumberPlate";
import { toast } from "sonner";
import appwriteService, { 
  CAR_OWNERS_TEAM_ID, 
  GARAGE_OPERATORS_TEAM_ID,
  DATABASE_ID,
  GARAGES_COLLECTION_ID
} from "../services/appwrite";
import { ID } from "appwrite";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Vehicle } from "../types";

const Onboarding = () => {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [registrationNumber, setRegistrationNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<Vehicle | null>(null);
  const [postcode, setPostcode] = useState<string>("");
  const [garagesList, setGaragesList] = useState<any[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<any | null>(null);
  const [newGarageDetails, setNewGarageDetails] = useState<any | null>(null);
  
  const navigate = useNavigate();
  const { login, register } = useUser();
  const { fetchVehicleData } = useVehicles();

  // Background images for each step - can be replaced later
  const bgImages = [
    "/lovable-uploads/0337f69d-c2bf-4fd7-8b4b-3a1f0b252d56.png", // bg1
    "/lovable-uploads/0337f69d-c2bf-4fd7-8b4b-3a1f0b252d56.png", // bg2
    "/lovable-uploads/0337f69d-c2bf-4fd7-8b4b-3a1f0b252d56.png", // bg3
  ];

  const slides = [
    {
      image: bgImages[0],
      title: "Artificial Intelligent Vehicle Assistant",
      description: "Get diagnosis and help with AI at your finger tips"
    },
    {
      image: bgImages[1],
      title: "Vehicle Updates",
      description: "Keep updated with the latest information\nMOT and TAX\nGet the best Quotes for insurance"
    },
    {
      image: bgImages[2],
      title: "Garage Finder",
      description: "Find reputable Garages anywhere in the UK automatically send diagnosis"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => 
        prevSlide === slides.length - 1 ? 0 : prevSlide + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
  };

  const handleStart = () => {
    setStep(2);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    }
  };

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === "car_owner") {
      setStep(3); // Show registration input step for car owners
    } else {
      setStep(6); // Show garage search step for garage operators
    }
  };

  const handleRegistrationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRegistration(e.target.value);
    setRegistrationNumber(formatted);
  };

  const handleRegistrationContinue = async () => {
    if (registrationNumber.length < 3) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch vehicle data from DVLA API and enhance with CheckCarDetails API
      toast.info('Fetching vehicle information...');
      const vehicleData = await fetchVehicleData(registrationNumber);
      
      if (vehicleData) {
        // Store vehicle data temporarily
        setVehicleDetails(vehicleData);
        toast.success('Vehicle found!');
        
        // Show account creation form
        setStep(5);
      } else {
        // Handle case when vehicle data can't be fetched
        setError("Could not find vehicle information. Please check the registration number.");
        toast.error("Could not find vehicle information");
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      setError("An error occurred while fetching vehicle information.");
      toast.error("Error fetching vehicle data");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Register user with Appwrite
      toast.info('Creating your account...');
      const user = await appwriteService.createAccount(email, password, name);
      
      if (user && user.$id) {
        // Create user profile
        await appwriteService.createUserProfile(user.$id, {
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
        });
        
        // Assign user to appropriate team based on role
        let teamId = '';
        switch (role) {
          case "car_owner":
            teamId = CAR_OWNERS_TEAM_ID;
            break;
          case "garage_operator":
            teamId = GARAGE_OPERATORS_TEAM_ID;
            break;
          default:
            teamId = CAR_OWNERS_TEAM_ID; // Default to car owner
        }
        
        await appwriteService.assignUserToTeam(user.$id, teamId);
        
        // Save additional data based on role
        if (role === "car_owner" && vehicleDetails) {
          await saveVehicleToUserAccount(user.$id);
        } else if (role === "garage_operator") {
          if (selectedGarage) {
            await claimExistingGarage(user.$id);
          } else if (newGarageDetails) {
            await createNewGarage(user.$id);
          }
        }
        
        toast.success('Account created successfully!');
        
        // Redirect based on role
        if (role === "car_owner") {
          navigate("/dashboard");
        } else {
          navigate("/garage/dashboard");
        }
      } else {
        setError("Failed to create account. Please try again.");
        toast.error("Account creation failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };
  
  // Save vehicle to user account
  const saveVehicleToUserAccount = async (userId: string) => {
    if (!vehicleDetails) return;
    
    try {
      // Create vehicle document in Appwrite
      const savedVehicle = await appwriteService.createVehicle({
        registration: vehicleDetails.registration,
        make: vehicleDetails.make,
        model: vehicleDetails.model,
        year: vehicleDetails.year,
        color: vehicleDetails.color,
        fuelType: vehicleDetails.fuelType,
        motStatus: vehicleDetails.motStatus,
        motExpiryDate: vehicleDetails.motExpiryDate,
        taxStatus: vehicleDetails.taxStatus,
        taxExpiryDate: vehicleDetails.taxExpiryDate,
        mileage: vehicleDetails.mileage,
        image: vehicleDetails.image,
        ownerId: userId
      });
      
      console.log('Vehicle saved:', savedVehicle);
      return savedVehicle;
    } catch (error) {
      console.error('Error saving vehicle:', error);
      throw error;
    }
  };
  
  // Handle postcode search for garages
  const handlePostcodeSearch = async () => {
    if (!postcode || postcode.length < 3) {
      setError("Please enter a valid postcode");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First, check if we need to import MOT stations
      const garagesCollection = await appwriteService.databases.listDocuments(
        DATABASE_ID,
        GARAGES_COLLECTION_ID,
        []
      );
      
      // If no garages exist, import them from the CSV file
      if (garagesCollection.documents.length === 0) {
        toast.info('Importing MOT stations data...');
        
        // Fetch the CSV file
        const response = await fetch('/active-mot-stations.csv');
        const csvData = await response.text();
        
        // Parse and import the data
        const stations = parseMotStationsCsv(csvData);
        await importMotStationsToAppwrite(stations);
        
        toast.success('MOT stations data imported successfully!');
      }
      
      // Search for garages by postcode
      const garages = await getGaragesByPostcode(postcode);
      
      if (garages.length > 0) {
        setGaragesList(garages);
        setStep(7); // Show garage selection step
      } else {
        setError("No garages found with that postcode. Please try another postcode or create a new garage.");
      }
    } catch (error) {
      console.error('Error searching for garages:', error);
      setError("An error occurred while searching for garages. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle garage selection
  const handleGarageSelection = (garage: any = null) => {
    setSelectedGarage(garage);
    
    if (garage) {
      toast.info(`Selected ${garage.name}`);
      setStep(5); // Go to account creation
    } else {
      setStep(6); // New garage form
    }
  };
  
  // Handle new garage form submission
  const handleNewGarageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get form data
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const garageData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      postcode: formData.get('postcode') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      services: []
    };
    
    setNewGarageDetails(garageData);
    toast.success('Garage details saved');
    setStep(5); // Go to account creation
  };
  
  // Claim existing garage
  const claimExistingGarage = async (userId: string) => {
    if (!selectedGarage) return false;
    
    try {
      toast.info(`Claiming ${selectedGarage.name}...`);
      
      // Update garage with new owner
      await appwriteService.databases.updateDocument(
        DATABASE_ID,
        GARAGES_COLLECTION_ID,
        selectedGarage.$id,
        {
          ownerId: userId,
          claimed: true,
          updatedAt: new Date().toISOString()
        }
      );
      
      toast.success('Garage claimed successfully');
      return true;
    } catch (error) {
      console.error("Error claiming garage:", error);
      toast.error("Failed to claim garage");
      return false;
    }
  };
  
  // Create new garage
  const createNewGarage = async (userId: string) => {
    if (!newGarageDetails) return false;
    
    try {
      toast.info('Creating your garage...');
      
      // Create new garage
      await appwriteService.databases.createDocument(
        DATABASE_ID,
        GARAGES_COLLECTION_ID,
        ID.unique(),
        {
          ...newGarageDetails,
          ownerId: userId,
          claimed: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      
      toast.success('Garage created successfully');
      return true;
    } catch (error) {
      console.error("Error creating garage:", error);
      toast.error("Failed to create garage");
      return false;
    }
  };

  // Function to get the current background image based on step
  const getCurrentBgImage = () => {
    // Default to first image, but use the current slide's image if on step 1
    return step === 1 ? slides[currentSlide].image : bgImages[0];
  };

  // Common background styling for all steps
  const backgroundStyle = {
    backgroundImage: `url('${getCurrentBgImage()}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.7)'
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Common background wrapper for all steps */}
      <div className="flex-1 flex flex-col relative">
        <div 
          className="absolute inset-0 z-0"
          style={backgroundStyle}
        />
        
        {/* Content for each step */}
        <div className="flex-1 flex flex-col justify-between z-10 text-white p-8">
          {step === 1 && (
            <>
              <div className="mt-6 flex justify-center">
                <div className="relative">
                  <img 
                    src="/lovable-uploads/Logo3.png" 
                    alt="GarageMunky Logo" 
                    className="h-72 w-auto" 
                  />
                </div>
              </div>
              
              <div className="space-y-4 pb-12">
                <Carousel 
                  className="w-full" 
                  opts={{ 
                    align: "center",
                    loop: true,
                  }}
                  setApi={(api) => {
                    api?.on("select", () => {
                      setCurrentSlide(api.selectedScrollSnap());
                    });
                  }}
                >
                  <CarouselContent>
                    {slides.map((slide, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <div className="text-center p-2">
                            <h2 className="text-3xl font-bold mb-2">
                              {slide.title}
                            </h2>
                            <p className="text-sm opacity-90 whitespace-pre-line">
                              {slide.description}
                            </p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="hidden md:flex">
                    <CarouselPrevious className="left-2 bg-primary/50 hover:bg-primary text-white" />
                    <CarouselNext className="right-2 bg-primary/50 hover:bg-primary text-white" />
                  </div>
                </Carousel>
                
                <div className="pt-4 flex justify-center space-x-2">
                  {slides.map((_, index) => (
                    <button 
                      key={index} 
                      onClick={() => handleSlideChange(index)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        index === currentSlide ? "w-8 bg-primary" : "w-4 bg-white/30"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                
                <Button 
                  className="bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-full w-full hover:opacity-90 transition-opacity mt-6"
                  onClick={handleStart}
                >
                  Get Started
                </Button>
                
                <p className="text-center text-sm pt-2">
                  Already have an account?{" "}
                  <button 
                    className="underline font-medium"
                    onClick={() => navigate("/auth")}
                  >
                    Login
                  </button>
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <h2 className="text-3xl font-bold mb-8 text-white">Choose Account Type</h2>
              
              <div className="space-y-4 w-full max-w-md">
                <button 
                  className="border border-white bg-black/50 rounded-xl p-6 w-full text-left hover:bg-black/70 transition-colors flex items-center"
                  onClick={() => handleSelectRole("car_owner")}
                >
                  <div className="bg-primary/10 text-primary p-4 rounded-full mr-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.4 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <path d="M9 17h6" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Car Owner</h3>
                    <p className="text-gray-300">Track maintenance, book services, get reminders</p>
                  </div>
                </button>
                
                <button 
                  className="border border-white bg-black/50 rounded-xl p-6 w-full text-left hover:bg-black/70 transition-colors flex items-center"
                  onClick={() => handleSelectRole("garage_operator")}
                >
                  <div className="bg-primary/10 text-primary p-4 rounded-full mr-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Garage Operator</h3>
                    <p className="text-gray-300">Manage bookings, connect with customers</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && role === "car_owner" && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <h2 className="text-3xl font-bold mb-6 text-white">Enter Your Vehicle Details</h2>
              <p className="text-gray-300 mb-8 text-center">
                Please enter your vehicle's registration number to continue
              </p>
              
              <div className="w-full max-w-md bg-black/50 p-8 rounded-2xl border border-white/30">
                <UKNumberPlate 
                  registrationNumber={registrationNumber} 
                  className="mb-8"
                />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration" className="text-white">Registration Number</Label>
                    <Input
                      id="registration"
                      value={registrationNumber}
                      onChange={handleRegistrationInput}
                      className="bg-white text-black text-center text-xl py-6 font-semibold tracking-wider uppercase"
                      placeholder="Enter registration"
                      maxLength={8}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleRegistrationContinue}
                    disabled={registrationNumber.trim().length < 3 || loading}
                    className="w-full mt-4 bg-primary text-primary-foreground py-6 text-lg"
                  >
                    {loading ? 'Searching...' : 'Next'}
                  </Button>
                  
                  {error && (
                    <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg mt-4">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && role === "garage_operator" && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <h2 className="text-3xl font-bold mb-6 text-white">Find Your Garage</h2>
              <p className="text-gray-300 mb-8 text-center">
                Enter your postcode to find and claim your garage
              </p>
              
              <div className="w-full max-w-md bg-black/50 p-8 rounded-2xl border border-white/30">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="postcode" className="text-white">Postcode</Label>
                    <Input
                      id="postcode"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      className="bg-white text-black text-xl py-6"
                      placeholder="Enter postcode"
                    />
                  </div>
                  
                  <Button 
                    onClick={handlePostcodeSearch}
                    disabled={postcode.trim().length < 5 || loading}
                    className="w-full mt-4 bg-primary text-primary-foreground py-6 text-lg"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                  
                  {error && (
                    <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg mt-4">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-8 text-center text-white">Login</h2>
              
              <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto w-full bg-black/50 p-8 rounded-2xl border border-white/30">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <button 
                  type="submit"
                  className="bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-full w-full hover:opacity-90 transition-opacity"
                >
                  Login
                </button>
                
                <p className="text-center text-white">
                  Don't have an account?{" "}
                  <button 
                    className="text-primary underline font-medium"
                    onClick={() => setStep(2)}
                    type="button"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* Garage selection step for garage operators */}
          {step === 4 && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <h2 className="text-3xl font-bold mb-6 text-white">Select Your Garage</h2>
              <p className="text-gray-300 mb-8 text-center">
                Select your garage from the list or create a new one
              </p>
              
              <div className="w-full max-w-md bg-black/50 p-8 rounded-2xl border border-white/30">
                <div className="space-y-4">
                  {garagesList.length > 0 ? (
                    <div className="space-y-4">
                      {garagesList.map((garage) => (
                        <button
                          key={garage.$id}
                          onClick={() => handleGarageSelection(garage)}
                          className="w-full text-left p-4 border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <h3 className="font-bold text-lg">{garage.name}</h3>
                          <p className="text-sm text-gray-300">{garage.address}</p>
                          <p className="text-sm text-gray-300">{garage.postcode}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-300">No garages found in this area</p>
                  )}
                  
                  <Button 
                    onClick={() => handleGarageSelection(null)}
                    className="w-full mt-4 bg-primary text-primary-foreground py-6 text-lg"
                  >
                    Create New Garage
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* New garage form */}
          {step === 6 && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <h2 className="text-3xl font-bold mb-6 text-white">Create New Garage</h2>
              <p className="text-gray-300 mb-8 text-center">
                Enter your garage details to continue
              </p>
              
              <form onSubmit={handleNewGarageSubmit} className="w-full max-w-md bg-black/50 p-8 rounded-2xl border border-white/30 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Garage Name</Label>
                  <Input
                    id="name"
                    name="name"
                    className="bg-white text-black"
                    placeholder="Enter garage name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    className="bg-white text-black"
                    placeholder="Enter address"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postcode" className="text-white">Postcode</Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    className="bg-white text-black"
                    placeholder="Enter postcode"
                    defaultValue={postcode}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    className="bg-white text-black"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    className="bg-white text-black"
                    placeholder="Enter email"
                    required
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="w-full mt-4 bg-primary text-primary-foreground py-6 text-lg"
                >
                  Continue
                </Button>
              </form>
            </div>
          )}
          
          {step === 5 && (
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-8 text-center text-white">Create Account</h2>
              
              <form onSubmit={handleRegister} className="space-y-6 max-w-md mx-auto w-full bg-black/50 p-8 rounded-2xl border border-white/30">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    placeholder="John Smith"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                <button 
                  type="submit"
                  className="bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-full w-full hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                
                <p className="text-center text-white">
                  Already have an account?{" "}
                  <button 
                    className="text-primary underline font-medium"
                    onClick={() => setStep(4)}
                    type="button"
                  >
                    Login
                  </button>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
