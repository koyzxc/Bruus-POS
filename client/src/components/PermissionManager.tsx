import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, ShoppingBag, Package, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PermissionManagerProps {
  user: User;
  onClose: () => void;
}

export default function PermissionManager({ user, onClose }: PermissionManagerProps) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState({
    canAddProducts: user.canAddProducts ?? true,
    canManageInventory: user.canManageInventory ?? true,
    canViewSales: user.canViewSales ?? true,
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (newPermissions: typeof permissions) => {
      const response = await apiRequest("PUT", `/api/admin/users/${user.id}/permissions`, newPermissions);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update permissions");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: `Permissions updated for ${user.username}`,
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

  const handlePermissionChange = (permission: keyof typeof permissions, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate(permissions);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-[#F15A29]" />
          Manage Permissions
        </CardTitle>
        <CardDescription>
          Control what {user.username} can access in the system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add Products Permission */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-5 w-5 text-gray-500" />
            <div className="space-y-0.5">
              <Label htmlFor="add-products" className="text-base font-medium">
                Add Products
              </Label>
              <p className="text-sm text-gray-500">
                Create new products and menu items
              </p>
            </div>
          </div>
          <Switch
            id="add-products"
            checked={permissions.canAddProducts}
            onCheckedChange={(value) => handlePermissionChange('canAddProducts', value)}
          />
        </div>

        {/* Manage Inventory Permission */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-gray-500" />
            <div className="space-y-0.5">
              <Label htmlFor="manage-inventory" className="text-base font-medium">
                Manage Inventory
              </Label>
              <p className="text-sm text-gray-500">
                Add, edit ingredients and stock levels
              </p>
            </div>
          </div>
          <Switch
            id="manage-inventory"
            checked={permissions.canManageInventory}
            onCheckedChange={(value) => handlePermissionChange('canManageInventory', value)}
          />
        </div>

        {/* View Sales Permission */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            <div className="space-y-0.5">
              <Label htmlFor="view-sales" className="text-base font-medium">
                View Financial Data
              </Label>
              <p className="text-sm text-gray-500">
                Access sales reports and analytics
              </p>
            </div>
          </div>
          <Switch
            id="view-sales"
            checked={permissions.canViewSales}
            onCheckedChange={(value) => handlePermissionChange('canViewSales', value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={updatePermissionsMutation.isPending}
            className="flex-1 bg-[#F15A29] hover:bg-[#D4471A]"
          >
            {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}