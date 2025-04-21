
import React from "react";

interface BackgroundWrapperProps {
  children: React.ReactNode;
}

const BackgroundWrapper = ({ children }: BackgroundWrapperProps) => {
  return (
    <div className="pb-20 min-h-screen bg-white">
      <div className="relative z-10 pt-5 max-w-md mx-auto">
        {children}
      </div>
    </div>
  );
};

export default BackgroundWrapper;
