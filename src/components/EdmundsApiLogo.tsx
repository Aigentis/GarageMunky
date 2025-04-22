import React, { useState, useEffect } from 'react';

interface EdmundsApiLogoProps {
  className?: string;
}

/**
 * Edmunds API Logo component
 * Displays the Edmunds API logo as required by their branding guidelines
 * Must be displayed on pages that use Edmunds API data
 */
const EdmundsApiLogo: React.FC<EdmundsApiLogoProps> = ({ className = '' }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [useLocalLogo, setUseLocalLogo] = useState(false);
  
  // Use the environment variable for the API key
  const apiKey = import.meta.env.VITE_EDMUNDS_API_KEY || '';
  const hasValidApiKey = apiKey && apiKey !== 'YOUR_EDMUNDS_API_KEY_HERE';
  
  // Construct the logo URL according to Edmunds API guidelines
  const logoUrl = hasValidApiKey
    ? `https://open-api.edmunds.com/api/openapi/v1/logo?size=220&format=horizontal&retina=true&color=blue&api_key=${apiKey}`
    : '/edmunds-api-logo.png'; // Fallback to a local image if no valid API key
  
  // If the API key is not valid or the remote logo fails to load, use a local fallback
  useEffect(() => {
    if (!hasValidApiKey) {
      setUseLocalLogo(true);
      return;
    }
    
    // Try to load the remote logo
    const img = new Image();
    img.onload = () => {
      setLogoLoaded(true);
      setUseLocalLogo(false);
    };
    img.onerror = () => {
      console.warn('Failed to load Edmunds API logo from remote URL, using local fallback');
      setUseLocalLogo(true);
    };
    img.src = logoUrl;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [hasValidApiKey, logoUrl]);
  
  // Fallback text to display if no logo is available
  const fallbackText = "Powered by Edmunds API";
  
  return (
    <div className={`edmunds-api-logo ${className}`}>
      <a 
        href="http://www.edmunds.com/?id=apis" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Powered by Edmunds API"
      >
        {useLocalLogo ? (
          // Use a simple text fallback if we can't load either logo
          <div className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">
            {fallbackText}
          </div>
        ) : (
          <img 
            src={logoUrl} 
            alt="Powered by Edmunds API" 
            width="220" 
            height="44"
            className="h-11 w-auto"
            onError={() => setUseLocalLogo(true)}
          />
        )}
      </a>
    </div>
  );
};

export default EdmundsApiLogo;
