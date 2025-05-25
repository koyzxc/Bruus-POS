import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Shield, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TopNavProps = {
  activeSection: "MENU" | "INV" | "SALES" | "ADMIN";
};

export default function TopNav({ activeSection }: TopNavProps) {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const navItems = [
    { label: "MENU", path: "/", section: "MENU" },
    { label: "INV.", path: "/inventory", section: "INV" },
  ];

  // Add SALES section only if user has permission
  if (user?.canViewSales) {
    navItems.push({ label: "SALES", path: "/sales", section: "SALES" });
  }

  // Add admin section for owner users
  if (user?.role === "owner") {
    navItems.push({ label: "ADMIN", path: "/admin/settings", section: "ADMIN" });
  }

  const handleSignOut = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="flex justify-end items-center space-x-2 mb-6">
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
      
      {/* Profile dropdown for baristas */}
      {user?.role === "barista" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-[46px] px-4 rounded bg-[#F15A29] hover:bg-[#E14A1F] text-white font-medium transition duration-300"
            >
              <User className="h-5 w-5 mr-2" />
              {user.username}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled className="font-medium">
              {user.username}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
