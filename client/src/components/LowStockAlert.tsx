import { AlertCircle } from "lucide-react";
import { Inventory } from "@shared/schema";
import React, { useState, useEffect } from "react";

type LowStockAlertProps = {
  item: Inventory;
};

export function LowStockAlert({ item }: LowStockAlertProps) {
  // Use useState and useEffect for animation
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  // Create animation effect when alert appears
  useEffect(() => {
    setIsVisible(true);
    
    // Optional: You could add a pulse animation that repeats
    const interval = setInterval(() => {
      setIsVisible((prev: boolean) => !prev);
      setTimeout(() => setIsVisible(true), 300);
    }, 10000); // Pulse every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate percentage for progress bar, ensuring it's a number
  const percentage = React.useMemo(() => {
    const current = Number(item.currentStock) || 0;
    const threshold = Number(item.minimumThreshold) || 1; // Prevent division by zero
    return Math.min(100, (current / threshold) * 100);
  }, [item.currentStock, item.minimumThreshold]);
  
  return (
    <div 
      className={`bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-2 mb-2 max-w-md rounded-r-md shadow-sm transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-70 -translate-x-2'
      }`}
      style={{ zIndex: 20 }}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 animate-pulse">
          <AlertCircle className="h-4 w-4 text-red-500" />
        </div>
        <div className="ml-2 w-full">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold">
              {item.name}
            </p>
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full font-medium">
              {item.currentStock} {item.unit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-red-500 h-1.5 rounded-full" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
