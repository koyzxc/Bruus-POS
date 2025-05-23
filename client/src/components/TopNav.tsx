import { useLocation } from "wouter";

type TopNavProps = {
  activeSection: "MENU" | "INV" | "SALES";
};

export default function TopNav({ activeSection }: TopNavProps) {
  const [, setLocation] = useLocation();
  
  const navItems = [
    { label: "MENU", path: "/", section: "MENU" },
    { label: "INV.", path: "/inventory", section: "INV" },
    { label: "SALES", path: "/sales", section: "SALES" },
  ];
  
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
