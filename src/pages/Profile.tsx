
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import NavBar from "../components/NavBar";
import { Camera, ChevronRight, LogOut, Mail, Phone, User, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Define an extended user type to fix TypeScript errors
interface ExtendedUser {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  location?: string;
  role?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user: legacyUser, logout: legacyLogout } = useUser();
  const { user: appwriteUser, signOut: appwriteLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Combine user data from both contexts
  const user: ExtendedUser = appwriteUser ? {
    id: appwriteUser.id,
    name: appwriteUser.name || legacyUser?.name || '',
    email: appwriteUser.email || legacyUser?.email || '',
    avatar: appwriteUser.profile?.avatar || legacyUser?.avatar,
    location: appwriteUser.profile?.location || legacyUser?.location || 'Greenwood Drive, Miami',
    role: appwriteUser.role || legacyUser?.role
  } : legacyUser || {};

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Logout from both contexts
      if (appwriteUser) {
        await appwriteLogout();
      }
      if (legacyUser) {
        legacyLogout();
      }
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Failed to logout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success("Avatar selected", { description: "Click Save to update your profile picture" });
    }
  };

  const profileOptions = [
    {
      icon: User,
      label: "Personal Information",
      action: "/profile/personal",
      description: "Name, email, phone number"
    },
    {
      icon: Mail,
      label: "Notifications",
      action: "/profile/notifications",
      description: "Manage your notification preferences"
    },
    {
      icon: Phone,
      label: "Support",
      action: "/profile/support",
      description: "Contact support"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 flex flex-col relative">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/lovable-uploads/0337f69d-c2bf-4fd7-8b4b-3a1f0b252d56.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        ></div>
        
        <div className="relative z-10 flex-1 flex flex-col p-6">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </header>

          <div className="flex-1 flex flex-col space-y-6 max-w-md mx-auto w-full bg-black/50 p-8 rounded-2xl border border-white/30">
            {/* Profile summary */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full border-4 border-primary bg-gray-800 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
                  ) : user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-gray-300" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer">
                  <Camera size={16} className="text-black" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-300">{user?.email}</p>
              <p className="text-sm flex items-center mt-1 text-gray-300">
                <span className="mr-1">📍</span> {user?.location || "Greenwood Drive, Miami"}
              </p>
              {avatarFile && (
                <Button 
                  className="mt-4 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full hover:opacity-90 transition-opacity flex items-center"
                  onClick={() => toast.info("Profile update", { description: "This feature is coming soon!" })}
                >
                  <Upload size={16} className="mr-2" />
                  Save Changes
                </Button>
              )}
            </div>

            {/* Profile options */}
            <div className="rounded-xl overflow-hidden bg-white/10 border border-white/20 mb-6">
              {profileOptions.map((option, index) => (
                <button
                  key={option.label}
                  className={`w-full flex items-center justify-between p-4 text-left ${
                    index !== profileOptions.length - 1 ? "border-b border-white/10" : ""
                  }`}
                  onClick={() => toast.info(`Navigating to ${option.label}`, { description: "This feature is coming soon!" })}
                >
                  <div className="flex items-center">
                    <div className="bg-white/10 p-2 rounded-full mr-3">
                      <option.icon size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-sm text-gray-300">{option.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </button>
              ))}
            </div>

            {/* Logout button */}
            <Button
              variant="outline"
              className="w-full mb-4 border-red-500 text-red-500 hover:bg-red-800/50 hover:text-red-300 py-6"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging out...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogOut size={18} className="mr-2" />
                  Log Out
                </div>
              )}
            </Button>
            
            <p className="text-center text-sm text-gray-400 mt-8">
              App Version 1.0.0
            </p>
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
};

export default Profile;
