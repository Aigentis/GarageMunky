
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface AlertNotificationsProps {
  hasExpiringMOT: boolean;
  hasExpiringTax: boolean;
}

const AlertNotifications = ({ hasExpiringMOT, hasExpiringTax }: AlertNotificationsProps) => {
  if (!hasExpiringMOT && !hasExpiringTax) return null;
  
  return (
    <div className="mx-4 my-4">
      <div className="bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-xl p-4 flex items-start">
        <div className="bg-amber-100 rounded-full p-2 mr-3">
          <AlertTriangle size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="font-medium">Attention needed</h3>
          <p className="text-sm text-gray-600">
            {hasExpiringMOT && "Your MOT is due soon. "}
            {hasExpiringTax && "Your road tax needs renewal. "}
            <Link to="/vehicles" className="text-primary font-medium">
              View details
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertNotifications;
