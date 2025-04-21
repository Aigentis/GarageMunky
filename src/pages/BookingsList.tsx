
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import NavBar from "../components/NavBar";
import { Button } from "@/components/ui/button";
import { useUser } from "../contexts/UserContext";
import { format } from "date-fns";

// Mock data for bookings
const mockBookings = [
  {
    id: "b1",
    garageId: "g1",
    garageName: "Mike's Auto Repair",
    vehicleId: "v1",
    vehicleName: "Honda Civic 2020",
    date: new Date(2025, 4, 15),
    time: "10:00 AM",
    status: "confirmed" as const,
    serviceType: "Oil Change",
    price: 49.99
  },
  {
    id: "b2",
    garageId: "g2",
    garageName: "Fast Fix Mechanics",
    vehicleId: "v2",
    vehicleName: "Toyota Corolla 2019",
    date: new Date(2025, 4, 20),
    time: "2:30 PM",
    status: "pending" as const,
    serviceType: "Tire Rotation",
    price: 39.99
  },
  {
    id: "b3",
    garageId: "g1",
    garageName: "Mike's Auto Repair",
    vehicleId: "v1",
    vehicleName: "Honda Civic 2020",
    date: new Date(2025, 4, 5),
    time: "3:00 PM",
    status: "completed" as const,
    serviceType: "Full Service",
    price: 199.99
  }
];

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

const BookingsList = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [filter, setFilter] = useState<string>("all");
  
  // Filter bookings based on selected filter
  const filteredBookings = filter === "all" 
    ? mockBookings 
    : mockBookings.filter(booking => booking.status === filter);

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-white p-4">
        <h1 className="text-2xl font-bold">Your Bookings</h1>
        <p className="text-gray-600 mt-1">
          Manage your garage appointments
        </p>
      </header>
      
      {/* Filter Tabs */}
      <div className="px-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 border-b">
          {["all", "pending", "confirmed", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                filter === status
                  ? "bg-primary/10 text-primary font-medium"
                  : "bg-transparent text-gray-500"
              }`}
            >
              {status === "all" ? "All Bookings" : capitalize(status)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bookings List */}
      <div className="px-4 pt-4">
        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-100 rounded-xl p-4 shadow-sm"
                onClick={() => navigate(`/bookings/${booking.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{booking.garageName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {capitalize(booking.status)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {booking.vehicleName} • {booking.serviceType}
                </div>
                
                <div className="flex items-center mt-3 text-sm text-gray-600">
                  <Calendar size={16} className="mr-1" />
                  <span>{format(booking.date, "PPP")}</span>
                  <Clock size={16} className="ml-4 mr-1" />
                  <span>{booking.time}</span>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="font-medium">${booking.price.toFixed(2)}</span>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar size={40} className="mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">No {filter === "all" ? "" : filter} bookings found</p>
            {user?.role === "car_owner" && (
              <Button 
                className="mt-4"
                onClick={() => navigate("/bookings/new")}
              >
                Book an Appointment
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Create New Booking */}
      {user?.role === "car_owner" && (
        <div className="fixed bottom-20 right-4">
          <Button
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={() => navigate("/bookings/new")}
          >
            +
          </Button>
        </div>
      )}
      
      {/* Bottom Navigation */}
      <NavBar />
    </div>
  );
};

export default BookingsList;
