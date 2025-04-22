
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Garage, getNearbyGarages } from "../../services/garageService";
import { toast } from "sonner";

const NearbyGarages = () => {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGarages = async () => {
      try {
        setLoading(true);
        setError(null);
        const nearbyGarages = await getNearbyGarages(5); // Get garages within 5km/miles
        setGarages(nearbyGarages);
      } catch (err) {
        console.error("Error fetching nearby garages:", err);
        setError("Failed to fetch nearby garages");
        toast.error("Failed to fetch nearby garages");
      } finally {
        setLoading(false);
      }
    };

    fetchGarages();
  }, []);

  // Function to render star rating
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="halfStar" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#D1D5DB" />
              </linearGradient>
            </defs>
            <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }

    return <div className="flex">{stars}</div>;
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-black">Nearby Garages</h2>
        <Link to="/garages" className="text-primary text-xs font-medium">
          See All
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-500">Finding garages near you...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-gray-500">
          <p>{error}</p>
          <button 
            onClick={() => getNearbyGarages().then(setGarages).catch(err => setError(String(err)))}
            className="mt-2 text-primary text-sm"
          >
            Try Again
          </button>
        </div>
      ) : garages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No garages found nearby.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex space-x-4 py-2 w-max">
            {garages.map((garage) => (
              <div key={garage.id} className="flex-shrink-0 w-full max-w-xs rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100">
                <div className="h-36 bg-gray-100 relative">
                  <img 
                    src={`/garage-images/${garage.id}.jpg`} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/garage-placeholder.jpg";
                    }}
                    alt={garage.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs flex items-center">
                    {renderRating(garage.rating)}
                    <span className="ml-1">{garage.rating.toFixed(1)}</span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full flex items-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="ml-1">{garage.distance} miles away</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-black">{garage.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">{garage.address}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {garage.services.slice(0, 3).map((service, index) => (
                      <span key={index} className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{service}</span>
                    ))}
                    {garage.services.length > 3 && (
                      <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">+{garage.services.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyGarages;
