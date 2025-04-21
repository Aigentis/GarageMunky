
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.4 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
          <path d="M15 5 9 15" strokeLinecap="round" />
          <path d="M9.4 5H15" strokeLinecap="round" />
          <path d="M9 15h5.6" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-6">
        The page you're looking for doesn't exist or has been moved
      </p>
      <Link to="/" className="gm-btn-primary max-w-xs">
        Return Home
      </Link>
    </div>
  );
};

export default NotFound;
