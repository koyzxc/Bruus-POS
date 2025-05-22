import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Inventory } from "@shared/schema";

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  currentStock: z.string().refine(val => parseFloat(val) > 0, {
    message: "Stock must be a positive number",
  }),
  minimumThreshold: z.string().refine(val => parseFloat(val) >= 0, {
    message: "Minimum threshold must be a non-negative number",
  }),
  
  // Primary container type (Box, Pack, Bag or direct units)
  containerType: z.string().min(1, "Container type is required"),
  
  // Quantity of secondary units (e.g., 10 pieces per box)
  containerQuantity: z.string().optional().transform(val => val === "" ? undefined : val),
  
  // Secondary unit (Piece, Pack, Bottle)
  secondaryUnit: z.string().optional(),
  
  // Quantity per secondary unit (e.g., 200ml per piece)
  quantityPerUnit: z.string().optional().transform(val => val === "" ? undefined : val),
  
  // Final measurement unit (ml, oz, pc, kg, g)
  unit: z.string().min(1, "Unit is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem?: Inventory; // Optional for editing
}

// Container type options
const containerTypeOptions = [
  { value: "direct", label: "Direct Measurement" }, // For single unit items
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "bag", label: "Bag" },
];

// Secondary unit options (what's inside the container)
const secondaryUnitOptions = [
  { value: "piece", label: "Piece" },
  { value: "pack", label: "Pack" },
  { value: "bottle", label: "Bottle" },
];

// Final measurement unit options
const unitOptions = [
  { value: "ml", label: "Milliliter (ml)" },
  { value: "oz", label: "Ounce (oz)" },
  { value: "pc", label: "Piece (pc)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
];

export default function InventoryForm({ isOpen, onClose, inventoryItem }: InventoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!inventoryItem;
  
  // State to track whether container details should be shown
  const [showContainerDetails, setShowContainerDetails] = useState(false);
  
  // State to track total calculated stock
  const [calculatedStock, setCalculatedStock] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: inventoryItem?.name || "",
      currentStock: inventoryItem?.currentStock?.toString() || "",
      minimumThreshold: inventoryItem?.minimumThreshold?.toString() || "",
      containerType: inventoryItem?.containerType || "direct",
      containerQuantity: inventoryItem?.containerQuantity?.toString() || "",
      secondaryUnit: inventoryItem?.secondaryUnit || "",
      quantityPerUnit: inventoryItem?.quantityPerUnit?.toString() || "",
      unit: inventoryItem?.unit || "",
    },
  });

  // Set form values when editing an existing item
  useEffect(() => {
    if (inventoryItem) {
      form.reset({
        name: inventoryItem.name,
        currentStock: inventoryItem.currentStock.toString(),
        minimumThreshold: inventoryItem.minimumThreshold.toString(),
        containerType: inventoryItem?.containerType || "direct",
        containerQuantity: inventoryItem?.containerQuantity?.toString() || "",
        secondaryUnit: inventoryItem?.secondaryUnit || "",
        quantityPerUnit: inventoryItem?.quantityPerUnit?.toString() || "",
        unit: inventoryItem.unit,
      });
      
      // If editing an item with a container type other than direct, show container details
      if (inventoryItem.containerType && inventoryItem.containerType !== "direct") {
        setShowContainerDetails(true);
      }
    }
  }, [inventoryItem, form]);
  
  // Watch container type to control whether to show container details
  const containerType = form.watch("containerType");
  const containerQuantity = form.watch("containerQuantity");
  const quantityPerUnit = form.watch("quantityPerUnit");
  
  // Update showContainerDetails based on container type
  useEffect(() => {
    setShowContainerDetails(containerType !== "direct");
    
    // Reset related fields when switching container types
    if (containerType === "direct") {
      form.setValue("containerQuantity", "");
      form.setValue("secondaryUnit", "");
      form.setValue("quantityPerUnit", "");
      setCalculatedStock(null);
    }
  }, [containerType, form]);
  
  // Calculate the total stock based on container quantities
  useEffect(() => {
    if (containerType !== "direct" && containerQuantity && quantityPerUnit) {
      const containers = 1; // Always 1 container (box, pack, etc.)
      const secondaryUnits = parseFloat(containerQuantity);
      const measurementPerUnit = parseFloat(quantityPerUnit);
      
      if (!isNaN(containers) && !isNaN(secondaryUnits) && !isNaN(measurementPerUnit)) {
        const totalStock = containers * secondaryUnits * measurementPerUnit;
        setCalculatedStock(totalStock.toFixed(2));
        
        // Auto-update the currentStock field
        form.setValue("currentStock", totalStock.toFixed(2));
      }
    }
  }, [containerType, containerQuantity, quantityPerUnit, form]);
  
  // When editing and changing currentStock, calculate and update container quantities
  const currentStock = form.watch("currentStock");
  
  useEffect(() => {
    // Only run this effect when editing items with container types
    if (isEditing && containerType !== "direct" && quantityPerUnit && parseFloat(quantityPerUnit) > 0) {
      const currentStockValue = parseFloat(currentStock);
      const quantityPerUnitValue = parseFloat(quantityPerUnit);
      
      if (!isNaN(currentStockValue) && !isNaN(quantityPerUnitValue) && quantityPerUnitValue > 0) {
        // Calculate how many secondary units are left based on current stock
        const calculatedSecondaryUnits = currentStockValue / quantityPerUnitValue;
        
        // Update the container quantity field
        form.setValue("containerQuantity", calculatedSecondaryUnits.toFixed(0));
      }
    }
  }, [currentStock, quantityPerUnit, containerType, isEditing, form]);
  
  // Create mutation for adding inventory items
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/inventory", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      // Invalidate both inventory and low-stock queries
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item",
        variant: "destructive",
      });
    },
  });
  
  // Update mutation for editing inventory items
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("PUT", `/api/inventory/${inventoryItem?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (isEditing && inventoryItem) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };
  
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing through the cancel button, not by clicking outside
      if (!open) {
        // Don't close automatically - this prevents outside clicks from closing
        return;
      }
    }}>
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault();
        }}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Ingredient" : "Add New Ingredient"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update ingredient details and stock levels." 
              : "Add a new ingredient to your inventory with stock levels and measurement units."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Milk, Coffee Beans, Sugar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stock</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="minimumThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Threshold</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="containerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Container Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select container type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {containerTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showContainerDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="containerQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity per Container</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1" 
                            min="1" 
                            placeholder="e.g., 10"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="secondaryUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {secondaryUnitOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Quantity per secondary unit field */}
                <FormField
                  control={form.control}
                  name="quantityPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity per {form.watch("secondaryUnit") || "Secondary Unit"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01" 
                          placeholder="e.g., 200 for 200ml per piece"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {calculatedStock && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      Total calculated stock: <span className="font-medium">{calculatedStock} {form.watch("unit")}</span>
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      (1 {form.watch("containerType")} × {form.watch("containerQuantity") || "0"} {form.watch("secondaryUnit") || "units"} × {form.watch("quantityPerUnit") || "0"} {form.watch("unit")} per unit)
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {showContainerDetails 
                      ? "Measurement Unit (per secondary unit)" 
                      : "Unit of Measurement"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#F15A29] hover:bg-[#D84A19]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  isEditing ? "Update Ingredient" : "Add Ingredient"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}