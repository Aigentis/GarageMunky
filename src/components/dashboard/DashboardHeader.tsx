
import { User } from "lucide-react";
import { User as UserType } from "../../types";

interface DashboardHeaderProps {
  user: UserType | null;
  greeting: string;
}

const DashboardHeader = ({ user, greeting }: DashboardHeaderProps) => {
  return (
    <header className="bg-white/0 p-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-500">My Location</div>
          <div className="flex items-center text-black font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="ml-1">{user?.location || "Greenwood Drive, Miami"}</span>
          </div>
        </div>

        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 relative">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <User size={20} />
            </div>
          )}
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mt-6 text-black">
        {greeting}, {user?.name.split(" ")[0] || "Chris"}!
      </h1>
      <p className="text-gray-500 mt-1">
        Time to hit the road! Select a car that matches your style.
      </p>
    </header>
  );
};

export default DashboardHeader;
