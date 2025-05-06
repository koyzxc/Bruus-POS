import { useAuth } from "@/hooks/use-auth";
import Logo from "./Logo";

type SidebarProps = {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  activeSection?: "MENU" | "INV" | "SALES";
};

export default function Sidebar({ activeCategory, setActiveCategory, activeSection }: SidebarProps) {
  const { logoutMutation } = useAuth();
  
  const handleSignOut = () => {
    logoutMutation.mutate();
  };
  
  const categories = ["COFFEE", "SHAKE", "FOOD", "OTHERS"];
  
  return (
    <div className="bg-[#F15A29] text-white md:w-64 flex-shrink-0">
      <div className="p-4 text-center border-b border-[#FF7A47]">
        <Logo />
      </div>
      
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">DASHBOARD</h2>
        
        {/* Only show categories in MENU section */}
        {activeSection === "MENU" || !activeSection ? (
          <nav className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${
                  activeCategory === category ? "active" : "inactive"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>
        ) : (
          <div className="text-center text-white opacity-80 mt-4 mb-10">
            {activeSection === "INV" ? "Inventory Management" : "Sales Analytics"}
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 p-4 w-64">
        <button
          className="w-full py-2 bg-[#FFE6C7] text-[#333333] rounded font-medium hover:bg-[#F5D7B5] transition duration-300"
          onClick={handleSignOut}
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
