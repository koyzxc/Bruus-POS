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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mediumPrice: z.string().min(1, "Medium (M) price is required"),
  hasLargeSize: z.boolean().default(false),
  largePrice: z.string().optional()
    .refine(val => !val || parseFloat(val) > 0, "Large price must be greater than 0")
    .transform(val => val === "" ? undefined : val),
  categoryId: z.string().min(1, "Category is required"),
  image: z.instanceof(FileList).optional(),
  mediumIngredients: z.array(z.object({
    inventoryId: z.string().min(1, "Ingredient is required"),
    quantityUsed: z.string().min(1, "Quantity is required"),
  })).default([]),
  largeIngredients: z.array(z.object({
    inventoryId: z.string().min(1, "Ingredient is required"),
    quantityUsed: z.string().min(1, "Quantity is required"),
  })).default([]),
}).refine(data => !data.hasLargeSize || (data.hasLargeSize && data.largePrice), {
  message: "Large price is required when large size is enabled",
  path: ["largePrice"]
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
  const [activeTab, setActiveTab] = useState<"medium" | "large">("medium");
  
  // Determine if this is editing a medium or large product
  const isEditingLargeProduct = product?.size === "L";
  
  // Categories query
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });
  
  // Inventory items query
  const { data: inventoryItems, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      mediumPrice: product?.size === "M" && product.price ? product.price.toString() : "",
      hasLargeSize: false,
      largePrice: product?.size === "L" && product.price ? product.price.toString() : "",
      categoryId: product?.categoryId ? product.categoryId.toString() : "",
      mediumIngredients: [],
      largeIngredients: [],
    },
  });
  
  const hasLargeSize = form.watch("hasLargeSize");
  
  // Field arrays for ingredients
  const { fields: mediumIngredients, append: appendMediumIngredient, remove: removeMediumIngredient } = useFieldArray({
    control: form.control,
    name: "mediumIngredients",
  });
  
  const { fields: largeIngredients, append: appendLargeIngredient, remove: removeLargeIngredient } = useFieldArray({
    control: form.control,
    name: "largeIngredients",
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
  
  // Update form with ingredients data when available
  useEffect(() => {
    if (productIngredients?.length > 0) {
      // We're editing an existing product
      const currentSize = product?.size || "M";
      
      if (currentSize === "M") {
        // This is a medium product, add ingredients to mediumIngredients
        productIngredients.forEach((ingredient: any) => {
          appendMediumIngredient({
            inventoryId: ingredient.inventoryId.toString(),
            quantityUsed: ingredient.quantityUsed.toString(),
          });
        });
      } else {
        // This is a large product, add ingredients to largeIngredients
        form.setValue("hasLargeSize", true);
        setActiveTab("large");
        
        productIngredients.forEach((ingredient: any) => {
          appendLargeIngredient({
            inventoryId: ingredient.inventoryId.toString(),
            quantityUsed: ingredient.quantityUsed.toString(),
          });
        });
      }
    }
  }, [productIngredients, appendMediumIngredient, appendLargeIngredient, product, form]);
  
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
  
  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
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
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number, formData: FormData }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        body: formData,
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
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Helper function to submit a single product
  const submitSingleProduct = async ({ 
    size, 
    price, 
    ingredients 
  }: { 
    size: "M" | "L", 
    price: string, 
    ingredients: { inventoryId: string, quantityUsed: string }[] 
  }) => {
    // If we're editing and the current product already has this size, update it
    const isUpdating = product && product.size === size;
    
    const formData = new FormData();
    formData.append("name", form.getValues("name"));
    formData.append("price", price);
    formData.append("categoryId", form.getValues("categoryId"));
    formData.append("size", size);
    
    // Add image if provided
    const imageFiles = form.getValues("image");
    if (imageFiles && imageFiles.length > 0) {
      formData.append("image", imageFiles[0]);
    } else if (product?.imageUrl && imagePreview && !imagePreview.startsWith("blob:")) {
      // Keep existing image URL if no new image is selected
      formData.append("imageUrl", product.imageUrl);
    }
    
    // Add ingredients
    if (ingredients && ingredients.length > 0) {
      // Add size info to each ingredient
      const ingredientsWithSize = ingredients.map(ing => ({
        ...ing,
        size
      }));
      formData.append("ingredients", JSON.stringify(ingredientsWithSize));
    }
    
    try {
      if (isUpdating && product && product.id) {
        // Update the existing product
        await updateMutation.mutateAsync({ id: product.id, formData });
      } else {
        // Create a new product
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error(`Error submitting ${size} product:`, error);
      throw error;
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      // Medium size is always created/updated
      await submitSingleProduct({
        size: "M",
        price: values.mediumPrice,
        ingredients: values.mediumIngredients || [],
      });
      
      // Create large size if the user enabled it and provided a price
      if (values.hasLargeSize && values.largePrice) {
        await submitSingleProduct({
          size: "L", 
          price: values.largePrice,
          ingredients: values.largeIngredients || [],
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting the form. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = categoriesLoading || inventoryLoading;
  
  // Switch to the large tab when hasLargeSize becomes true
  useEffect(() => {
    if (hasLargeSize && activeTab !== "large") {
      setActiveTab("large");
    }
  }, [hasLargeSize]);
  
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
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
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
              
              {/* Size Variants Section */}
              <div className="space-y-4 border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Size Options</h3>
                  
                  <FormField
                    control={form.control}
                    name="hasLargeSize"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormLabel>Add Large Size</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "medium" | "large")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="medium">Medium (M)</TabsTrigger>
                    <TabsTrigger value="large" disabled={!hasLargeSize}>Large (L)</TabsTrigger>
                  </TabsList>
                  
                  {/* Medium Size Tab */}
                  <TabsContent value="medium" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="mediumPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medium Price</FormLabel>
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
                    
                    {/* Medium Ingredients */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-md font-medium">Medium Ingredients</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendMediumIngredient({ inventoryId: "", quantityUsed: "" })}
                          className="flex items-center gap-1"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Ingredient
                        </Button>
                      </div>
                      
                      {mediumIngredients.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No ingredients added yet</p>
                      )}
                      
                      {mediumIngredients.map((field, index) => (
                        <Card key={field.id} className="shadow-sm">
                          <CardContent className="pt-4 pb-2">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                              {/* Ingredient Select */}
                              <div className="sm:col-span-6">
                                <FormField
                                  control={form.control}
                                  name={`mediumIngredients.${index}.inventoryId`}
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
                                  name={`mediumIngredients.${index}.quantityUsed`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quantity</FormLabel>
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
                              
                              {/* Remove Button */}
                              <div className="sm:col-span-2 flex items-end justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMediumIngredient(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  {/* Large Size Tab */}
                  <TabsContent value="large" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="largePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Large Price</FormLabel>
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
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Large Ingredients */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-md font-medium">Large Ingredients</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendLargeIngredient({ inventoryId: "", quantityUsed: "" })}
                          className="flex items-center gap-1"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Ingredient
                        </Button>
                      </div>
                      
                      {largeIngredients.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No ingredients added yet</p>
                      )}
                      
                      {largeIngredients.map((field, index) => (
                        <Card key={field.id} className="shadow-sm">
                          <CardContent className="pt-4 pb-2">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                              {/* Ingredient Select */}
                              <div className="sm:col-span-6">
                                <FormField
                                  control={form.control}
                                  name={`largeIngredients.${index}.inventoryId`}
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
                                  name={`largeIngredients.${index}.quantityUsed`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quantity</FormLabel>
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
                              
                              {/* Remove Button */}
                              <div className="sm:col-span-2 flex items-end justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLargeIngredient(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter>
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
                  className="bg-[#F15A29] hover:bg-[#D84A19] ml-2" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{product ? "Update" : "Create"}</>
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