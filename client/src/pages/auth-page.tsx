import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Coffee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, navigate] = useLocation();

  // Create form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle form submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Main content container */}
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white relative z-10">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-black rounded-t-full px-12 pt-6 pb-2">
                <h1 className="text-4xl font-serif font-bold text-white">Bruus</h1>
              </div>
              <div className="mt-2">
                <h2 className="text-2xl font-bold">By SidePocket.</h2>
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-semibold text-[#F15A29]">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-[#FFE6C7] rounded-xl p-5">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="w-full p-2 border border-[#F5D7B5] rounded focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                            placeholder="Enter your username"
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            className="w-full p-2 border border-[#F5D7B5] rounded focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-[#F15A29] hover:bg-[#D84A19] text-white py-2 rounded transition duration-300 font-medium"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                  
                  {/* Default accounts information removed */}
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
      

    </div>
  );
}
