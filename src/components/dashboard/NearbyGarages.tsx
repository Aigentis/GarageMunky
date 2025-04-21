
import { Link } from "react-router-dom";

const NearbyGarages = () => {
  return (
    <div className="px-4 pt-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-black">Nearby You</h2>
        <Link to="/garages" className="text-primary text-xs font-medium">
          See All
        </Link>
      </div>
      
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex space-x-4 py-2 w-max">
          <div className="flex-shrink-0 w-full max-w-xs rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100">
            <div className="h-36 bg-gray-100 relative">
              <img 
                src="/lovable-uploads/e3cede36-07a4-4a16-b5bf-f6e7285c65ad.png" 
                alt="Range Rover Sport"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex flex-col space-y-2">
                <div className="bg-white rounded-full px-2 py-1 text-xs flex items-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 12-3-3-3 3 3 3 3-3Z" />
                  </svg>
                  <span className="ml-1">250 km/h</span>
                </div>
                <div className="bg-white rounded-full px-2 py-1 text-xs flex items-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 14-6-6-6 6" />
                  </svg>
                  <span className="ml-1">8.9 L</span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full flex items-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="ml-1">Biscayne Boulevard</span>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-black">Range Rover Sport</h3>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-full max-w-xs rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100">
            <div className="h-36 bg-gray-100 relative">
              <img 
                src="/placeholder.svg" 
                alt="Chevrolet Tahoe"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex flex-col space-y-2">
                <div className="bg-white rounded-full px-2 py-1 text-xs flex items-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 12-3-3-3 3 3 3 3-3Z" />
                  </svg>
                  <span className="ml-1">220 km/h</span>
                </div>
                <div className="bg-white rounded-full px-2 py-1 text-xs flex items-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 14-6-6-6 6" />
                  </svg>
                  <span className="ml-1">7 L</span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full flex items-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="ml-1">Margaret Pace Park</span>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-black">Chevrolet Tahoe</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyGarages;
