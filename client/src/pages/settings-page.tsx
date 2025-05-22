import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import TopNav from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Edit, LogOut } from "lucide-react";
import { User } from "@shared/schema";

const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "barista"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "barista",
    },
  });

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: user?.role === "owner",
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      console.log("Creating user with data:", data);
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: (newUser) => {
      console.log("User created successfully:", newUser);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      setEditingUser(null);
      form.reset();
      toast({
        title: "User created",
        description: "New user has been created successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<UserFormValues> }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      form.reset();
      toast({
        title: "User updated",
        description: "User has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: UserFormValues) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: values });
    } else {
      createUserMutation.mutate(values);
    }
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    form.reset({
      username: userToEdit.username,
      password: "", // Don't show current password
      role: userToEdit.role as "owner" | "barista",
    });
  };

  const handleDeleteUser = (userId: number) => {
    if (userId === user?.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Redirect if not owner
  if (user?.role !== "owner") {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav activeSection="SETTINGS" />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Access denied. Only owners can access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav activeSection="SETTINGS" />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage users and system settings</p>
          </div>
          {user?.role === "owner" && (
            <Button 
              variant="outline" 
              onClick={() => logoutMutation.mutate()}
              className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Management</CardTitle>
                <CardDescription>
                  Create and manage accounts for your coffee shop including the existing barista account
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen || !!editingUser} onOpenChange={(open) => {
                if (!open) {
                  setIsCreateDialogOpen(false);
                  setEditingUser(null);
                  form.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#F15A29] hover:bg-[#D84A19]">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? "Update user information and permissions" : "Add a new user to the system"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{editingUser ? "New Password (leave empty to keep current)" : "Password"}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="barista">Barista</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="bg-[#F15A29] hover:bg-[#D84A19]">
                          {editingUser ? "Update User" : "Create User"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsCreateDialogOpen(false);
                            setEditingUser(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">{userItem.username}</TableCell>
                      <TableCell>
                        <Badge variant={userItem.role === "owner" ? "default" : "secondary"}>
                          {userItem.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(userItem)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {userItem.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}