
import { User, MapPin, Bell, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardHeaderProps {
  userName?: string;
  userLocation?: string;
}

const DashboardHeader = ({ userName, userLocation }: DashboardHeaderProps) => {
  return (
    <header className="p-4 pt-6">
      <div className="flex justify-between items-center mb-4">
        <Link to="/" className="flex items-center">
          <h1 className="text-xl font-bold text-white">GarageMunky</h1>
        </Link>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Search size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell size={20} />
          </Button>
          <Link to="/profile">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 relative bg-black/30">
              <div className="w-full h-full flex items-center justify-center">
                <User size={20} className="text-white/70" />
              </div>
              <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </Link>
        </div>
      </div>

      <div className="flex items-center mb-2">
        <MapPin size={16} className="text-primary mr-1" />
        <span className="text-sm text-white/80">{userLocation || "Greenwood Drive, Miami"}</span>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-white">
        Hello, {userName?.split(" ")[0] || "Driver"}!
      </h1>
      <p className="text-white/70 mb-6">
        Time to hit the road! What would you like to do today?
      </p>
      
      <div className="relative mb-6">
        <Input 
          placeholder="Search for vehicles, services, or garages..." 
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl py-6 pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
      </div>
    </header>
  );
};

export default DashboardHeader;
