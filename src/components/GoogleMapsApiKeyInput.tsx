
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface GoogleMapsApiKeyInputProps {
  onApiKeyChange: (apiKey: string) => void;
}

const LOCAL_STORAGE_KEY = "garage_finder_maps_api_key";

const GoogleMapsApiKeyInput: React.FC<GoogleMapsApiKeyInputProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Try to load the API key from localStorage
    const savedApiKey = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      onApiKeyChange(savedApiKey);
    } else {
      // If no API key is found, start in editing mode
      setIsEditing(true);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey) {
      localStorage.setItem(LOCAL_STORAGE_KEY, apiKey);
      onApiKeyChange(apiKey);
      setIsEditing(false);
      toast({
        title: "API Key Saved",
        description: "Your Google Maps API key has been saved.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter a valid Google Maps API key.",
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
      <h3 className="font-medium mb-2">Google Maps API Key</h3>
      <p className="text-sm text-gray-600 mb-3">
        To use the map features, you need to provide a Google Maps API key. 
        {!isEditing && apiKey && " Your API key is saved."}
      </p>
      
      {isEditing ? (
        <div className="flex flex-col space-y-2">
          <Input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google Maps API key"
            className="flex-1"
          />
          <div className="flex items-center justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save API Key</Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your API key will be saved in your browser's local storage.
          </p>
        </div>
      ) : (
        <Button onClick={handleEdit}>
          {apiKey ? "Change API Key" : "Add API Key"}
        </Button>
      )}
    </div>
  );
};

export default GoogleMapsApiKeyInput;
