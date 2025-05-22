import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

type TopNavProps = {
  activeSection: "MENU" | "INV" | "SALES" | "SETTINGS";
};

export default function TopNav({ activeSection }: TopNavProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const baseItems: { label: string; path: string; section: "MENU" | "INV" | "SALES" | "SETTINGS" }[] = [
    { label: "MENU", path: "/", section: "MENU" },
    { label: "INV.", path: "/inventory", section: "INV" },
    { label: "SALES", path: "/sales", section: "SALES" },
  ];

  const navItems = user?.role === "owner" 
    ? [...baseItems, { label: "SETTINGS", path: "/settings", section: "SETTINGS" as const }]
    : baseItems;
  
  return (
    <div className="flex justify-end space-x-2 mb-6">
      {navItems.map((item) => (
        <button
          key={item.section}
          className={`nav-btn ${
            activeSection === item.section ? "active" : "inactive"
          }`}
          onClick={() => setLocation(item.path)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
