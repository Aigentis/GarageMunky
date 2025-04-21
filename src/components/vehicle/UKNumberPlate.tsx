
import React from "react";
import { cn } from "@/lib/utils";

interface UKNumberPlateProps {
  registrationNumber: string;
  className?: string;
}

const UKNumberPlate: React.FC<UKNumberPlateProps> = ({ 
  registrationNumber = "", 
  className 
}) => {
  // Format the registration to ensure it displays correctly
  const formattedRegistration = registrationNumber.toUpperCase();
  
  return (
    <div className={cn("flex justify-center", className)}>
      <div 
        className="relative overflow-hidden rounded-md border-2 border-black"
        style={{
          width: "330px",
          height: "90px",
          backgroundColor: "#F1F1F1", // Light gray background
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* Blue band on the left side of the plate */}
        <div className="absolute left-0 top-0 bottom-0 w-14 bg-blue-600 flex flex-col items-center justify-center">
          <div className="text-white font-bold text-xs">GB</div>
          <div className="mt-1 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center">
            <div className="text-blue-600 font-bold text-xs">UK</div>
          </div>
        </div>
        
        {/* Registration number text with appropriate spacing */}
        <div 
          className="absolute left-16 right-0 top-0 bottom-0 flex items-center justify-center"
          style={{
            fontFamily: "'CharlesWright', 'Arial Narrow', sans-serif",
            fontWeight: "700",
            fontSize: "42px",
            letterSpacing: formattedRegistration.length > 6 ? "2px" : "4px",
          }}
        >
          {formattedRegistration || "AB12 CDE"}
        </div>
      </div>
    </div>
  );
};

export default UKNumberPlate;
