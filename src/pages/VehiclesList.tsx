
import { useState } from "react";
import { useVehicles } from "../contexts/VehicleContext";
import { useUser } from "../contexts/UserContext";
import VehicleCard from "../components/VehicleCard";
import NavBar from "../components/NavBar";
import BackgroundWrapper from "../components/dashboard/BackgroundWrapper";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search } from "lucide-react";

const VehiclesList = () => {
  const { userVehicles, loading } = useVehicles();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVehicles = userVehicles.filter(
    (vehicle) =>
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.registration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BackgroundWrapper>
      {/* Header */}
      <header className="gm-page-header">
        <div className="flex items-center w-full justify-between">
          <Link to="/dashboard" className="gm-back-button">
            <ArrowLeft size={24} />
          </Link>
          
          <h1 className="gm-header-title">Your Vehicles</h1>
          
          <Link to="/vehicles/add" className="gm-back-button">
            <Plus size={24} />
          </Link>
        </div>
      </header>

      {/* Search */}
      <div className="gm-section">
        <div className="relative">
          <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-full pl-10 pr-4 py-2 border-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Content */}
      <div className="gm-section pb-20">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-t-primary border-r-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading vehicles...</p>
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            {searchQuery ? (
              <>
                <Search size={40} className="text-gray-400 mx-auto" />
                <p className="mt-3 text-gray-600">No vehicles match your search</p>
              </>
            ) : (
              <>
                <svg width="40" height="40" className="mx-auto text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.4 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
                <p className="mt-3 text-gray-600">No vehicles added yet</p>
              </>
            )}
            <Link
              to="/vehicles/add"
              className="mt-4 inline-block gm-btn-primary max-w-xs"
            >
              Add Vehicle
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <NavBar />
    </BackgroundWrapper>
  );
};

export default VehiclesList;
