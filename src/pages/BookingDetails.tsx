
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowLeft, 
  Car,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import NavBar from "../components/NavBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "../contexts/UserContext";
import { BookingStatus, PaymentStatus } from "../types";

// Define a proper type for the booking details
interface BookingDetail {
  id: string;
  garageId: string;
  garageName: string;
  garageAddress: string;
  garagePhone: string;
  garageEmail: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleRegistration: string;
  date: Date;
  time: string;
  duration: string;
  status: BookingStatus;
  serviceType: string;
  services: { name: string; price: number }[];
  notes?: string;
  price: number;
  paymentStatus: PaymentStatus;
}

// Mock booking data with additional details
const mockBookingDetails: BookingDetail = {
  id: "b1",
  garageId: "g1",
  garageName: "Mike's Auto Repair",
  garageAddress: "123 Main Street, Miami, FL 33139",
  garagePhone: "+1 305-555-1234",
  garageEmail: "info@mikesauto.com",
  vehicleId: "v1",
  vehicleMake: "Honda",
  vehicleModel: "Civic",
  vehicleYear: 2020,
  vehicleRegistration: "ABC123",
  date: new Date(2025, 4, 15),
  time: "10:00 AM",
  duration: "1 hour",
  status: "confirmed",
  serviceType: "Oil Change",
  services: [
    { name: "Oil Change", price: 39.99 },
    { name: "Oil Filter Replacement", price: 10.00 }
  ],
  notes: "Please use synthetic oil 5W-30",
  price: 49.99,
  paymentStatus: "pending"
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch(status) {
    case "confirmed":
      return "bg-green-100 text-green-600";
    case "pending":
      return "bg-amber-100 text-amber-600";
    case "completed":
      return "bg-blue-100 text-blue-600";
    case "cancelled":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

// Helper function to capitalize first letter
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const BookingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingDetail>(mockBookingDetails);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Simulate fetching booking details
  useEffect(() => {
    console.log(`Fetching booking details for ID: ${id}`);
    // In a real app, we'd fetch from API based on ID
  }, [id]);

  const handleCancelBooking = () => {
    // Simulate API call
    setTimeout(() => {
      setBooking({...booking, status: "cancelled"});
      setShowCancelDialog(false);
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    }, 500);
  };

  // Check if booking exists
  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Booking not found</h1>
        <p className="text-gray-600 mb-6 text-center">
          The booking you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/bookings")}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-white p-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/bookings")}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Booking Details</h1>
        </div>
      </header>
      
      {/* Status Banner */}
      <div className={`${getStatusColor(booking.status)} py-2 px-4 text-center`}>
        <span className="text-sm font-medium">
          Status: {capitalize(booking.status)}
        </span>
      </div>
      
      {/* Booking Details */}
      <div className="p-4 space-y-6">
        {/* Appointment Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-lg mb-3">Appointment Details</h2>
          
          <div className="space-y-3">
            <div className="flex">
              <Calendar size={20} className="text-gray-500 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-gray-600">
                  {format(booking.date, "PPP")} at {booking.time} ({booking.duration})
                </p>
              </div>
            </div>
            
            <div className="flex">
              <Car size={20} className="text-gray-500 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Vehicle</p>
                <p className="text-sm text-gray-600">
                  {booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel}
                </p>
                <p className="text-xs text-gray-500">Reg: {booking.vehicleRegistration}</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="text-gray-500 mr-3 flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Service Type</p>
                <p className="text-sm text-gray-600">{booking.serviceType}</p>
              </div>
            </div>
            
            {booking.notes && (
              <div className="flex">
                <div className="text-gray-500 mr-3 flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Notes</p>
                  <p className="text-sm text-gray-600">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Garage Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-lg mb-3">Garage Information</h2>
          
          <div className="space-y-3">
            <p className="font-medium">{booking.garageName}</p>
            
            <div className="flex">
              <MapPin size={20} className="text-gray-500 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-600">{booking.garageAddress}</p>
            </div>
            
            <div className="flex">
              <Phone size={20} className="text-gray-500 mr-3 flex-shrink-0" />
              <a href={`tel:${booking.garagePhone}`} className="text-sm text-primary">
                {booking.garagePhone}
              </a>
            </div>
            
            <div className="flex">
              <Mail size={20} className="text-gray-500 mr-3 flex-shrink-0" />
              <a href={`mailto:${booking.garageEmail}`} className="text-sm text-primary">
                {booking.garageEmail}
              </a>
            </div>
          </div>
        </div>
        
        {/* Payment Details */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-lg mb-3">Payment Details</h2>
          
          <div className="space-y-3">
            {booking.services.map((service, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm">{service.name}</span>
                <span className="text-sm">${service.price.toFixed(2)}</span>
              </div>
            ))}
            
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span>${booking.price.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Payment Status</span>
              <span className={
                booking.paymentStatus === "paid" 
                  ? "text-green-600" 
                  : "text-amber-600"
              }>
                {capitalize(booking.paymentStatus)}
              </span>
            </div>
          </div>
          
          {booking.paymentStatus === "pending" && (
            <Button className="w-full mt-4">
              Pay Now
            </Button>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      {booking.status !== "cancelled" && booking.status !== "completed" && (
        <div className="px-4 pt-2 pb-4">
          <div className="flex gap-3">
            {user?.role === "car_owner" && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate(`/bookings/${booking.id}/edit`)}
              >
                Reschedule
              </Button>
            )}
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      )}
      
      {/* Cancel Confirmation Dialog (simple implementation) */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Cancel Booking</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelDialog(false)}
              >
                No, Keep It
              </Button>
              <Button 
                variant="destructive"
                onClick={handleCancelBooking}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Navigation */}
      <NavBar />
    </div>
  );
};

export default BookingDetails;
