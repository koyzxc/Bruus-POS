import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Shield } from "lucide-react";

type TopNavProps = {
  activeSection: "MENU" | "INV" | "SALES" | "ADMIN";
};

export default function TopNav({ activeSection }: TopNavProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    { label: "MENU", path: "/", section: "MENU" },
    { label: "INV.", path: "/inventory", section: "INV" },
    { label: "SALES", path: "/sales", section: "SALES" },
  ];

  // Add admin section for owner users
  if (user?.role === "owner") {
    navItems.push({ label: "ADMIN", path: "/admin/settings", section: "ADMIN" });
  }
  
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
          {item.section === "ADMIN" ? (
            <Shield className="h-4 w-4" />
          ) : (
            item.label
          )}
        </button>
      ))}
    </div>
  );
}
