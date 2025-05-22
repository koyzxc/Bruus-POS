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
import { useAuth } from "@/hooks/use-auth";
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
  
  // Number of containers (e.g., 2 boxes)
  numberOfContainers: z.string().optional().transform(val => val === "" ? "1" : val),
  
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
  { value: "case", label: "Case" },
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
  { value: "L", label: "Liter (L)" },
  { value: "oz", label: "Ounce (oz)" },
  { value: "pc", label: "Piece (pc)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
];

export default function InventoryForm({ isOpen, onClose, inventoryItem }: InventoryFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!inventoryItem;
  const isOwner = user?.role === "owner";
  
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
      numberOfContainers: inventoryItem?.numberOfContainers?.toString() || "1", // Default to 1 container
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
        numberOfContainers: inventoryItem?.numberOfContainers?.toString() || "1", // Default to 1 container
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
  const numberOfContainers = form.watch("numberOfContainers") || "1";
  
  // Function to recalculate stock based on container inputs
  const recalculateStock = () => {
    if (containerType !== "direct") {
      // Ensure we have valid quantity per unit
      if (!quantityPerUnit) return;
      
      // Handle empty container quantity
      if (!containerQuantity) {
        setCalculatedStock(null);
        return;
      }
      
      const containers = parseFloat(numberOfContainers || "1");
      const secondaryUnits = parseFloat(containerQuantity);
      const measurementPerUnit = parseFloat(quantityPerUnit);
      const unit = form.watch("unit");
      
      if (!isNaN(containers) && !isNaN(secondaryUnits) && !isNaN(measurementPerUnit)) {
        let totalStock = containers * secondaryUnits * measurementPerUnit;
        
        // For grams, ensure it's an integer
        // Use consistent decimal formatting for all units
        setCalculatedStock(totalStock.toFixed(2));
        form.setValue("currentStock", totalStock.toFixed(2));
      }
    }
  };
  
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
    if (containerType !== "direct" && quantityPerUnit) {
      // Handle case when containerQuantity is empty or zero
      if (!containerQuantity) {
        setCalculatedStock(null);
        return;
      }
      
      const containers = parseFloat(numberOfContainers || "1");
      const secondaryUnits = parseFloat(containerQuantity);
      const measurementPerUnit = parseFloat(quantityPerUnit);
      const unit = form.watch("unit");
      
      if (!isNaN(containers) && !isNaN(secondaryUnits) && !isNaN(measurementPerUnit)) {
        let totalStock = containers * secondaryUnits * measurementPerUnit;
        
        // For grams, ensure it's an integer
        // Use consistent decimal formatting for all units
        setCalculatedStock(totalStock.toFixed(2));
        
        // Auto-update the currentStock field
        form.setValue("currentStock", totalStock.toFixed(2));
      }
    }
  }, [containerType, containerQuantity, quantityPerUnit, numberOfContainers, form, form.watch("unit")]);
  
  // When editing and changing currentStock, calculate and update container quantities
  const currentStock = form.watch("currentStock");
  
  useEffect(() => {
    // Only run this effect when editing items with container types
    if (isEditing && containerType !== "direct" && quantityPerUnit && parseFloat(quantityPerUnit) > 0) {
      const currentStockValue = parseFloat(currentStock);
      const quantityPerUnitValue = parseFloat(quantityPerUnit);
      const containersValue = parseFloat(numberOfContainers || "1");
      
      if (!isNaN(currentStockValue) && !isNaN(quantityPerUnitValue) && quantityPerUnitValue > 0 && containersValue > 0) {
        // Calculate how many secondary units are left based on current stock and number of containers
        const calculatedSecondaryUnits = currentStockValue / (quantityPerUnitValue * containersValue);
        
        // Update the container quantity field
        form.setValue("containerQuantity", calculatedSecondaryUnits.toFixed(0));
      }
    }
  }, [currentStock, quantityPerUnit, containerType, numberOfContainers, isEditing, form]);
  
  // Create a new inventory item
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Send data as is - the server will handle the conversions
      const formattedData = {
        ...data,
        currentStock: data.currentStock,
        minimumThreshold: data.minimumThreshold,
        containerQuantity: data.containerQuantity || null,
        numberOfContainers: data.numberOfContainers || "1",
        quantityPerUnit: data.quantityPerUnit || null,
      };
      
      const response = await apiRequest("POST", "/api/inventory", formattedData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Success",
        description: "Inventory item created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update an existing inventory item
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!inventoryItem) return null;
      
      // Keep values as strings to match schema validation requirements
      const formattedData = {
        ...data,
        currentStock: data.currentStock,
        minimumThreshold: data.minimumThreshold,
        containerQuantity: data.containerQuantity || null,
        numberOfContainers: data.numberOfContainers || "1",
        quantityPerUnit: data.quantityPerUnit || null,
      };
      
      const response = await apiRequest("PATCH", `/api/inventory/${inventoryItem.id}`, formattedData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        updateMutation.mutate(values);
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only close if explicitly requested, prevent accidental closing
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent 
        className="max-w-md md:max-w-xl max-h-[85vh] overflow-y-auto" 
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Ingredient" : "Add New Ingredient"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update ingredient details and stock levels."
              : "Enter details for the new inventory ingredient."
            }
          </DialogDescription>
        </DialogHeader>
        
        {calculatedStock && containerType !== "direct" && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="font-medium">Calculated total: {calculatedStock} {form.watch("unit")}</p>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium">{parseFloat(numberOfContainers || "1")} {containerType}{parseFloat(numberOfContainers || "1") > 1 ? 'es' : ''}</span> × {containerQuantity} {form.watch("secondaryUnit") || "units"} × {quantityPerUnit} {form.watch("unit")}/unit = {calculatedStock} {form.watch("unit")}
            </p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Coffee Beans" {...field} />
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
                        min={isOwner ? "0" : (isEditing ? inventoryItem?.currentStock : "0")}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          // For baristas, prevent decreasing quantity below original value
                          if (!isOwner && isEditing && 
                              parseFloat(e.target.value) < parseFloat(inventoryItem?.currentStock?.toString() || "0")) {
                            toast({
                              title: "Permission Restricted",
                              description: "Only owners can decrease inventory quantities.",
                              variant: "destructive"
                            });
                            // Reset to original value
                            field.onChange(inventoryItem?.currentStock?.toString());
                          } else {
                            field.onChange(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    {!isOwner && isEditing && (
                      <p className="text-xs text-amber-600 mt-1">
                        Note: You can only add to the current quantity. Only owners can decrease inventory.
                      </p>
                    )}
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
                    <div className="flex items-center space-x-2">
                      <FormControl className="flex-1">
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground border px-3 py-2 rounded-md min-w-[60px] text-center">
                        {form.watch("unit") || "unit"}
                      </div>
                    </div>
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      
                      // Trigger recalculation if we're using containers
                      if (containerType !== "direct" && quantityPerUnit && containerQuantity) {
                        const containers = parseFloat(numberOfContainers || "1");
                        const secondaryUnits = parseFloat(containerQuantity);
                        const measurementPerUnit = parseFloat(quantityPerUnit);
                        
                        if (!isNaN(containers) && !isNaN(secondaryUnits) && !isNaN(measurementPerUnit)) {
                          let totalStock = containers * secondaryUnits * measurementPerUnit;
                          
                          // Use consistent decimal formatting for all units
                          setCalculatedStock(totalStock.toFixed(2));
                          form.setValue("currentStock", totalStock.toFixed(2));
                        }
                      }
                    }}
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
                    name="numberOfContainers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Containers</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1" 
                            min="1" 
                            placeholder="e.g., 2"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // We'll let the useEffect handle the recalculation
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">How many {form.watch("containerType") || "containers"}?</p>
                      </FormItem>
                    )}
                  />
                
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
                            onChange={(e) => {
                              field.onChange(e);
                              // We'll let the useEffect handle the recalculation
                            }}
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
                            {containerType === "pack" 
                              ? secondaryUnitOptions.filter(option => option.value === "piece").map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))
                              : secondaryUnitOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))
                            }
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
                      <div className="flex items-center space-x-2">
                        <FormControl className="flex-1">
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 200"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // We'll let the useEffect handle the recalculation
                            }}
                          />
                        </FormControl>
                        <div className="text-sm text-muted-foreground border px-3 py-2 rounded-md min-w-[60px] text-center">
                          {form.watch("unit") || "unit"}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Measurement Unit</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Recalculate when unit changes
                      recalculateStock();
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {containerType === "Pack" 
                        ? unitOptions.filter(option => ["g", "kg", "ml", "l"].includes(option.value)).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                        : unitOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                      }
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