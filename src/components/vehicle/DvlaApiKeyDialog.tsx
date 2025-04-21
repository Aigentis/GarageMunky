
import React, { useState } from "react";
import { Key } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dvlaService } from "../../services/dvlaService";

interface DvlaApiKeyDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

const DvlaApiKeyDialog: React.FC<DvlaApiKeyDialogProps> = ({ dialogOpen, setDialogOpen }) => {
  const [apiKey, setApiKey] = useState(dvlaService.getApiKey() || "");

  const saveApiKey = () => {
    if (apiKey && apiKey.trim()) {
      dvlaService.setApiKey(apiKey.trim());
      toast.success("API key saved successfully");
      setDialogOpen(false);
    } else {
      toast.error("Please enter a valid API key");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-1">
          <Key size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>DVLA API Key</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="api-key">Enter your DVLA API Key</Label>
          <Input 
            id="api-key" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-2"
            placeholder="Enter your DVLA API key"
          />
          <p className="text-xs text-gray-500 mt-2">
            Get your DVLA Vehicle Enquiry API key from the 
            <a href="https://developer-portal.driver-vehicle-licensing.api.gov.uk/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 ml-1">
              DVLA Developer Portal
            </a>
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveApiKey}>
            Save API Key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DvlaApiKeyDialog;
