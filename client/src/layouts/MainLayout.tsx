import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import OrderPanel from "@/components/OrderPanel";

type MainLayoutProps = {
  children: ReactNode;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  activeSection: "MENU" | "INV" | "SALES" | "ADMIN";
  onOpenInventoryForm?: () => void;
};

export default function MainLayout({
  children,
  activeCategory,
  setActiveCategory,
  activeSection,
  onOpenInventoryForm,
}: MainLayoutProps) {

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Sidebar */}
      <Sidebar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeSection={activeSection}
        onOpenInventoryForm={onOpenInventoryForm}
      />
      
      {/* Middle Content */}
      <div className="flex-grow bg-white bg-opacity-95 overflow-y-auto">
        <div className="p-4">
          {/* Top Navigation */}
          <TopNav activeSection={activeSection} />
          
          {/* Main Content */}
          {children}
        </div>
      </div>
      
      {/* Right Order Panel - Only show for MENU section */}
      {activeSection === "MENU" && (
        <div className="bg-[#FFE6C7] w-72 md:w-80 flex-shrink-0">
          <div className="p-4 h-full flex flex-col">
            {/* Order Panel */}
            <div className="flex-grow flex flex-col">
              <OrderPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
