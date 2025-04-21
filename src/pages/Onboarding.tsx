
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserRole } from "../types";
import { useUser } from "../contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRegistration } from "../utils/vehicleUtils";
import UKNumberPlate from "@/components/vehicle/UKNumberPlate";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Onboarding = () => {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [registrationNumber, setRegistrationNumber] = useState<string>("");
  
  const navigate = useNavigate();
  const { login, register } = useUser();

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
      setStep(5); // Skip to registration form for garage operators
    }
  };

  const handleRegistrationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRegistration(e.target.value);
    setRegistrationNumber(formatted);
  };

  const handleRegistrationContinue = () => {
    setStep(5);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    const success = await register(name, email, password, role);
    if (success) {
      navigate("/dashboard");
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
                  <div className="absolute inset-0 bg-white/10 blur-xl rounded-full animate-pulse scale-125"></div>
                  <div className="absolute inset-0 bg-white/10 blur-lg rounded-full animate-pulse opacity-40 scale-115 animate-[pulse_3s_ease-in-out_infinite]"></div>
                  <div className="absolute inset-0 bg-white/15 blur-md rounded-full animate-[pulse_2s_ease-in-out_infinite] opacity-50 scale-105"></div>
                  
                  <div className="relative z-10">
                    <img 
                      src="/lovable-uploads/c9d50f1a-2edd-4bde-b7e1-f44384dba0e6.png" 
                      alt="GarageMunky Logo" 
                      className="h-72 w-auto" 
                      style={{ 
                        filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))' 
                      }}
                    />
                  </div>
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
                    onClick={() => setStep(4)}
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

          {step === 3 && (
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
                    disabled={registrationNumber.trim().length < 3}
                    className="w-full mt-4 bg-primary text-primary-foreground py-6 text-lg"
                  >
                    Next
                  </Button>
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
                
                <button 
                  type="submit"
                  className="bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-full w-full hover:opacity-90 transition-opacity"
                >
                  Create Account
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
