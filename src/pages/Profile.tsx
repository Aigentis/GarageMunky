
import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import NavBar from "../components/NavBar";
import { Camera, ChevronRight, LogOut, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Profile = () => {
  const { user, logout } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    setIsLoading(true);
    // Simulate logout delay
    setTimeout(() => {
      logout();
      toast.success("Logged out successfully");
      setIsLoading(false);
    }, 1000);
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
    <div className="gm-page-container">
      <header className="gm-page-header border-b">
        <h1 className="gm-header-title mx-auto">Profile</h1>
      </header>

      <div className="px-4 py-6">
        {/* Profile summary */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full border-4 border-primary bg-gray-100 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-gray-500" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-primary rounded-full p-2">
              <Camera size={16} className="text-black" />
            </button>
          </div>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-gray-500">{user?.email}</p>
          <p className="text-sm flex items-center mt-1">
            <span className="mr-1">📍</span> {user?.location || "Greenwood Drive, Miami"}
          </p>
        </div>

        {/* Profile options */}
        <div className="rounded-xl overflow-hidden bg-white border border-gray-100 mb-6">
          {profileOptions.map((option, index) => (
            <button
              key={option.label}
              className={`w-full flex items-center justify-between p-4 text-left ${
                index !== profileOptions.length - 1 ? "border-b border-gray-100" : ""
              }`}
              onClick={() => toast.info(`Navigating to ${option.label}`, { description: "This feature is coming soon!" })}
            >
              <div className="flex items-center">
                <div className="bg-gray-100 p-2 rounded-full mr-3">
                  <option.icon size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* Logout button */}
        <Button
          variant="outline"
          className="w-full mb-4 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 py-6"
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Logging out...
            </div>
          ) : (
            <div className="flex items-center">
              <LogOut size={18} className="mr-2" />
              Log Out
            </div>
          )}
        </Button>
        
        <p className="text-center text-sm text-gray-500 mt-8">
          App Version 1.0.0
        </p>
      </div>

      <NavBar />
    </div>
  );
};

export default Profile;
