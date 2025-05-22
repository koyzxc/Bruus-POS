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

// Restock form schema
const restockSchema = z.object({
  numberOfContainers: z.string().min(1, "Number of containers is required"),
  containerQuantity: z.string().min(1, "Container quantity is required"),
  quantityPerUnit: z.string().min(1, "Quantity per unit is required"),
});

type RestockFormValues = z.infer<typeof restockSchema>;

interface RestockFormProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: Inventory;
}

export default function RestockForm({ isOpen, onClose, inventoryItem }: RestockFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedAddition, setCalculatedAddition] = useState<string | null>(null);

  // Initialize form
  const form = useForm<RestockFormValues>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      numberOfContainers: "1",
      containerQuantity: "",
      quantityPerUnit: "",
    },
  });

  // Watch form values for real-time calculation
  const numberOfContainers = form.watch("numberOfContainers") || "1";
  const containerQuantity = form.watch("containerQuantity") || "";
  const quantityPerUnit = form.watch("quantityPerUnit") || "";

  // Calculate addition in real-time
  useEffect(() => {
    if (numberOfContainers && containerQuantity && quantityPerUnit) {
      const containers = parseFloat(numberOfContainers);
      const quantity = parseFloat(containerQuantity);
      const perUnit = parseFloat(quantityPerUnit);
      
      if (!isNaN(containers) && !isNaN(quantity) && !isNaN(perUnit) && containers > 0 && quantity > 0 && perUnit > 0) {
        const addition = containers * quantity * perUnit;
        setCalculatedAddition(addition.toFixed(2));
      } else {
        setCalculatedAddition(null);
      }
    } else {
      setCalculatedAddition(null);
    }
  }, [numberOfContainers, containerQuantity, quantityPerUnit]);

  // Restock mutation
  const restockMutation = useMutation({
    mutationFn: async (values: RestockFormValues) => {
      const containers = parseFloat(values.numberOfContainers);
      const quantity = parseFloat(values.containerQuantity);
      const perUnit = parseFloat(values.quantityPerUnit);
      const addition = containers * quantity * perUnit;
      const newStock = parseFloat(inventoryItem.currentStock) + addition;
      
      const res = await apiRequest("PATCH", `/api/inventory/${inventoryItem.id}`, {
        currentStock: newStock.toFixed(2),
        // Update container information based on restock
        numberOfContainers: containers.toString(),
        containerQuantity: quantity.toString(),
        quantityPerUnit: perUnit.toString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Stock updated successfully",
        description: `Added ${calculatedAddition} ${inventoryItem.unit} to ${inventoryItem.name}`,
      });
      onClose();
      form.reset();
      setCalculatedAddition(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: RestockFormValues) => {
    setIsSubmitting(true);
    restockMutation.mutate(values);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle>Restock {inventoryItem.name}</DialogTitle>
          <DialogDescription className="mt-2">
            Add new stock to the existing inventory. This will be added to the current stock of {parseFloat(inventoryItem.currentStock)} {inventoryItem.unit}.
          </DialogDescription>
        </DialogHeader>
        
        {calculatedAddition && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="font-medium text-green-800">Stock to be added: +{calculatedAddition} {inventoryItem.unit}</p>
            <p className="text-sm text-green-600 mt-2">
              New total: {(parseFloat(inventoryItem.currentStock) + parseFloat(calculatedAddition)).toFixed(2)} {inventoryItem.unit}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {numberOfContainers} {inventoryItem.containerType || 'container'}{parseFloat(numberOfContainers || "1") > 1 ? 's' : ''} × {containerQuantity} {inventoryItem.secondaryUnit || 'units'} × {quantityPerUnit} {inventoryItem.unit}/unit = +{calculatedAddition} {inventoryItem.unit}
            </p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numberOfContainers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of {inventoryItem.containerType || 'Container'}s</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1" 
                        min="1" 
                        placeholder="e.g., 2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="containerQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{inventoryItem.secondaryUnit || 'Units'} per {inventoryItem.containerType || 'Container'}</FormLabel>
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
            </div>
            
            <FormField
              control={form.control}
              name="quantityPerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{inventoryItem.unit} per {inventoryItem.secondaryUnit || 'Unit'}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        placeholder="e.g., 900"
                        {...field}
                        className="flex-1"
                      />
                      <div className="px-3 py-2 bg-gray-100 border rounded-md min-w-[60px] flex items-center justify-center text-sm">
                        {inventoryItem.unit}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-8">
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
                disabled={isSubmitting || !calculatedAddition}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Stock
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}