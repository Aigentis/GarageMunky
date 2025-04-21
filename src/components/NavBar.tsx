
import { Home, Car, Calendar, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const NavBar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      icon: Home,
      path: "/dashboard",
      label: "Home"
    },
    {
      icon: Car,
      path: "/vehicles",
      label: "Vehicles"
    },
    {
      icon: Calendar,
      path: "/bookings",
      label: "Bookings"
    },
    {
      icon: MessageCircle,
      path: "/diagnostic",
      label: "Chat"
    },
    {
      icon: User,
      path: "/profile",
      label: "Profile"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 flex justify-around py-2 px-4 z-10">
      {navItems.map((item) => {
        const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center p-2 ${
              isActive ? "text-primary" : "text-gray-500"
            }`}
          >
            <div className={`rounded-full p-2 ${isActive ? "bg-primary" : "border border-gray-700"}`}>
              <item.icon size={20} />
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default NavBar;
