import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";

// Ingredient schema
const ingredientSchema = z.object({
  inventoryId: z.string().min(1, "Ingredient is required"),
  quantityUsed: z.string().min(1, "Quantity is required"),
});

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.string().min(1, "Price is required"),
  categoryId: z.string().min(1, "Category is required"),
  image: z.instanceof(FileList).optional(),
  ingredients: z.array(ingredientSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product; // For editing existing product
}

export default function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl || null
  );
  
  // Categories query
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });
  
  // Inventory items query (for future ingredient selection)
  const { data: inventoryItems, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });
  
  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // For multipart form data, we need to use the native fetch API
      const res = await fetch("/api/products", {
        method: "POST",
        body: data,
        // Don't set Content-Type header as the browser will set it with boundary
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create product");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product created",
        description: "Product has been created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create product",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FormData }) => {
      // For multipart form data, we need to use the native fetch API
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        body: data,
        // Don't set Content-Type header as the browser will set it with boundary
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update product");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated",
        description: "Product has been updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update product",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Fetch product ingredients if editing
  const { data: productIngredients, isLoading: ingredientsLoading } = useQuery({
    queryKey: ["/api/products", product?.id, "ingredients"],
    queryFn: async () => {
      if (!product?.id) return [];
      const res = await fetch(`/api/products/${product.id}/ingredients`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!product?.id, // Only run if product id exists
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      price: product?.price?.toString() || "",
      categoryId: product?.categoryId?.toString() || "",
      ingredients: [],
    },
  });
  
  // Field array for ingredients
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });
  
  // Update form with ingredients data when available
  useEffect(() => {
    if (productIngredients?.length > 0) {
      // Reset ingredients field with loaded data
      productIngredients.forEach((ingredient: any) => {
        append({
          inventoryId: ingredient.inventoryId.toString(),
          quantityUsed: ingredient.quantityUsed.toString(),
        });
      });
    }
  }, [productIngredients, append]);
  
  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("price", values.price);
    formData.append("categoryId", values.categoryId);
    
    // Add image if provided
    if (values.image && values.image.length > 0) {
      formData.append("image", values.image[0]);
    } else if (product?.imageUrl && !imagePreview?.startsWith("blob:")) {
      // Keep existing image URL if no new image is selected
      formData.append("imageUrl", product.imageUrl);
    }
    
    // Add ingredients if provided
    if (values.ingredients && values.ingredients.length > 0) {
      // Convert ingredients to JSON string
      const ingredientsJson = JSON.stringify(values.ingredients);
      formData.append("ingredients", ingredientsJson);
    }
    
    if (product?.id) {
      // Update existing product
      updateMutation.mutate({ id: product.id, data: formData });
    } else {
      // Create new product
      createMutation.mutate(formData);
    }
  };
  
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = categoriesLoading || inventoryLoading;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update the product details below."
              : "Fill in the details to add a new product."}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded overflow-hidden">
                        <span className="text-gray-500 px-3 py-2 bg-gray-50">₱</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="flex-1 border-0 focus-visible:ring-0"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: any) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            onChange(e.target.files);
                            handleImageChange(e);
                          }}
                          {...field}
                        />
                        {imagePreview && (
                          <div className="relative w-full h-48 rounded-md overflow-hidden border">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Ingredients Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Ingredients</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ inventoryId: "", quantityUsed: "" })}
                    className="flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Ingredient
                  </Button>
                </div>
                
                {fields.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No ingredients added yet</p>
                )}
                
                {fields.map((field, index) => (
                  <Card key={field.id} className="shadow-sm">
                    <CardContent className="pt-4 pb-2">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                        {/* Ingredient Select */}
                        <div className="sm:col-span-6">
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.inventoryId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ingredient</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select ingredient" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {inventoryItems?.map((item: any) => (
                                      <SelectItem
                                        key={item.id}
                                        value={item.id.toString()}
                                      >
                                        {item.name} ({item.unit})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Quantity Field */}
                        <div className="sm:col-span-4">
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.quantityUsed`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="Amount"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Delete button */}
                        <div className="sm:col-span-2 flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mb-2 h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
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
                      {product ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    product ? "Update Product" : "Add Product"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}