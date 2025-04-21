
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const carBrands = [
  { label: "All", path: "/vehicles" },
  { label: "Tesla", path: "/vehicles?brand=tesla" },
  { label: "Mercedes", path: "/vehicles?brand=mercedes" },
  { label: "Audi", path: "/vehicles?brand=audi" }
];

const QuickActions = () => {
  return (
    <div className="gm-section">
      <div className="gm-tabs">
        {carBrands.map((brand) => (
          <Link 
            key={brand.label} 
            to={brand.path}
            className={`gm-tab ${brand.label === "All" ? "gm-tab-active" : "gm-tab-inactive"}`}
          >
            {brand.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
