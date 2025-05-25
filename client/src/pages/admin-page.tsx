import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Only owners should have access to this page
  if (!user || user.role !== "owner") {
    return <Redirect to="/" />;
  }
  
  const deleteCoffeeMatchaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/special/delete-coffee-matcha");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete Coffee Matcha product");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update cache for products
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "Success",
        description: data.message || "Coffee Matcha product deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete Coffee Matcha product",
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteCoffeeMatcha = () => {
    if (confirm("Are you sure you want to delete the Coffee Matcha product and its sales history? This action cannot be undone.")) {
      deleteCoffeeMatchaMutation.mutate();
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Functions</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Product Management</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Special Operations</h3>
            <p className="text-gray-600 mb-4">
              These operations are irreversible and should be used with caution.
            </p>
            
            <Button
              onClick={handleDeleteCoffeeMatcha}
              variant="destructive"
              disabled={deleteCoffeeMatchaMutation.isPending}
            >
              {deleteCoffeeMatchaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Coffee Matcha Product & History"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}