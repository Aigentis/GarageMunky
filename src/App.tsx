import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { VehicleProvider } from "./contexts/VehicleContext";
import { AppRoutes } from "./routes";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import VehiclesList from "./pages/VehiclesList";
import VehicleDetails from "./pages/VehicleDetails";
import AddVehicle from "./pages/AddVehicle";
import BookingsList from "./pages/BookingsList";
import BookingDetails from "./pages/BookingDetails";
import NewBooking from "./pages/NewBooking";
import Diagnostic from "./pages/Diagnostic";
import GarageLocations from "./pages/GarageLocations";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <VehicleProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </VehicleProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
