import { AlertCircle, Plus } from "lucide-react";
import { Inventory } from "@shared/schema";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// Helper function to format stock values based on unit type and quantity
const formatStockDisplay = (value: string, unit: string): { value: string, unit: string } => {
  const numValue = parseFloat(value);
  
  // Helper to remove trailing zeros and decimal point if no fractional part
  const removeTrailingZeros = (num: number): string => {
    // Convert to string with 2 decimal places
    const strValue = num.toFixed(2);
    
    // If it ends with .00, return just the integer part
    if (strValue.endsWith('.00')) {
      return Math.floor(num).toString();
    }
    
    // Otherwise, return with appropriate decimal places, removing trailing zeros
    return parseFloat(strValue).toString();
  };
  
  if (unit === "g" && numValue >= 1000) {
    // Convert grams to kilograms if >= 1000g
    return { 
      value: removeTrailingZeros(numValue / 1000), 
      unit: "kg" 
    };
  } else if (unit === "g" && numValue < 1000) {
    // For grams under 1000, remove decimal places
    return { 
      value: Math.round(numValue).toString(), 
      unit: "g" 
    };
  } else if (unit === "ml" && numValue >= 1000) {
    // Convert milliliters to liters if >= 1000ml
    return { 
      value: removeTrailingZeros(numValue / 1000), 
      unit: "L" 
    };
  } else if (unit === "ml" && numValue < 1000) {
    // For milliliters under 1000, remove decimal places
    return { 
      value: Math.round(numValue).toString(), 
      unit: "ml" 
    };
  }
  
  // For other units, still use the decimal formatting cleanup
  return { 
    value: removeTrailingZeros(numValue), 
    unit 
  };
};

type LowStockAlertProps = {
  item: Inventory;
  onRestockClick?: (item: Inventory) => void;
};

export function LowStockAlert({ item, onRestockClick }: LowStockAlertProps) {
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
            <div className="flex items-center gap-1">
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full font-medium">
                {(() => {
                  const formattedStock = formatStockDisplay(item.currentStock, item.unit || "");
                  return `${formattedStock.value}${formattedStock.unit}`;
                })()}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-5 w-5 p-0 bg-green-50 hover:bg-green-100 border-green-300"
                onClick={() => {
                  if (onRestockClick) {
                    onRestockClick(item);
                  }
                }}
              >
                <Plus className="h-3 w-3 text-green-600" />
              </Button>
            </div>
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