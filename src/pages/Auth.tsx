import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInWithApple, register, error, clearError, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CAR_OWNER);
  const [step, setStep] = useState<number>(1); // 1: Login, 2: Register
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  
  // Background images for each step - using the same as onboarding
  const bgImages = [
    "/lovable-uploads/0337f69d-c2bf-4fd7-8b4b-3a1f0b252d56.png",
    "/lovable-uploads/0337f69d-c2bf-4fd7-8b4b-3a1f0b252d56.png",
    "/lovable-uploads/0337f69d-c2bf-4fd7-8b4b-3a1f0b252d56.png",
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

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when changing steps
  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    clearError();
    setLocalError(null);
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setLocalError(null);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setLocalError(null);
      await register(email, password, name, role);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setLocalError(null);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Apple login
  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      setLocalError(null);
      await signInWithApple();
    } catch (err) {
      console.error('Apple login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Common background styling for all steps
  const backgroundStyle = {
    backgroundImage: `url('${slides[currentSlide].image}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.7)'
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 flex flex-col relative">
        <div 
          className="absolute inset-0 z-0"
          style={backgroundStyle}
        ></div>
        
        <div className="relative z-10 flex-1 flex flex-col p-6">
          {step === 1 && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-2">GarageMunky</h1>
                <p className="text-2xl font-medium">Your Vehicles AI Assistant</p>
              </div>
          
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-white">Password</label>
                    <a href="#" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                {(error || localError) && (
                  <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg">
                    {error || localError}
                  </div>
                )}
                
                <button 
                  type="submit"
                  className="bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-full w-full hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Login'}
                </button>
                
                <div className="relative w-full my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/30" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black/50 px-2 text-white/70">Or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    className="border border-white/30 text-white py-2 px-4 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    Google
                  </button>
                  <button 
                    type="button" 
                    className="border border-white/30 text-white py-2 px-4 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={handleAppleLogin}
                    disabled={loading}
                  >
                    Apple
                  </button>
                </div>
                
                <p className="text-center text-white mt-4">
                  Don't have an account?{" "}
                  <button 
                    className="text-primary underline font-medium"
                    onClick={() => handleStepChange(2)}
                    type="button"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          )}
          
          {step === 2 && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-2">GarageMunky</h1>
                <p className="text-2xl font-medium">Your Vehicles AI Assistant</p>
              </div>
              
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
                
                <div>
                  <label className="block text-sm font-medium mb-3 text-white">I am a:</label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={(value) => setRole(value as UserRole)}
                    className="flex flex-col space-y-3"
                  >
                    <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg">
                      <RadioGroupItem value={UserRole.CAR_OWNER} id="car-owner" className="text-primary" />
                      <Label htmlFor="car-owner" className="text-white font-medium">Car Owner</Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg">
                      <RadioGroupItem value={UserRole.GARAGE_OPERATOR} id="garage-operator" className="text-primary" />
                      <Label htmlFor="garage-operator" className="text-white font-medium">Garage Operator</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {(error || localError) && (
                  <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg">
                    {error || localError}
                  </div>
                )}
                
                <button 
                  type="submit"
                  className="bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-full w-full hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                
                <div className="relative w-full my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/30" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black/50 px-2 text-white/70">Or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    className="border border-white/30 text-white py-2 px-4 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    Google
                  </button>
                  <button 
                    type="button" 
                    className="border border-white/30 text-white py-2 px-4 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={handleAppleLogin}
                    disabled={loading}
                  >
                    Apple
                  </button>
                </div>
                
                <p className="text-center text-white mt-4">
                  Already have an account?{" "}
                  <button 
                    className="text-primary underline font-medium"
                    onClick={() => handleStepChange(1)}
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

export default Auth;
