
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/onboarding");
    }
  }, [navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-t-primary border-r-primary border-gray-200 rounded-full animate-spin"></div>
    </div>
  );
};

export default Index;
