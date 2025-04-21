
import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useVehicles } from "../contexts/VehicleContext";
import NavBar from "../components/NavBar";
import BackgroundWrapper from "../components/dashboard/BackgroundWrapper";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import QuickActions from "../components/dashboard/QuickActions";
import UserVehicles from "../components/dashboard/UserVehicles";
import AlertNotifications from "../components/dashboard/AlertNotifications";

const Dashboard = () => {
  const { user } = useUser();
  const { userVehicles, loading } = useVehicles();
  const [greeting, setGreeting] = useState<string>("Morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Morning");
    else if (hour < 18) setGreeting("Afternoon");
    else setGreeting("Evening");
  }, []);

  return (
    <BackgroundWrapper>
      <DashboardHeader user={user} greeting={greeting} />
      <AlertNotifications hasExpiringMOT={true} hasExpiringTax={false} />
      <QuickActions />
      <UserVehicles loading={loading} vehicles={userVehicles} />
      <NavBar />
    </BackgroundWrapper>
  );
};

export default Dashboard;
