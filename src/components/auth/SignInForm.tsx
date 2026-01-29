import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/googleAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { AuthHeader } from "./AuthHeader";

const signInSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

interface SignInFormProps {
    onToggleMode: () => void;
    onForgotPassword: () => void;
    onSuccess: (session: any) => void;
}

export function SignInForm({ onToggleMode, onForgotPassword, onSuccess }: SignInFormProps) {
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { toast } = useToast();

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            const { error } = await signInWithGoogle("/dashboard");
            if (error) {
                toast({
                    title: "Google Sign-In Failed",
                    description: error.message || "Could not sign in with Google",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    const form = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const trackLogin = async (success: boolean) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const ua = navigator.userAgent;
            let browser = "Unknown";
            let os = "Unknown";
            let deviceType = "desktop";

            if (ua.includes("Firefox")) browser = "Firefox";
            else if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
            else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
            else if (ua.includes("Edg")) browser = "Edge";

            if (ua.includes("Windows")) os = "Windows";
            else if (ua.includes("Mac OS")) os = "macOS";
            else if (ua.includes("Linux")) os = "Linux";
            else if (ua.includes("Android")) os = "Android";
            else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

            if (ua.includes("Mobile")) deviceType = "mobile";
            else if (ua.includes("Tablet") || ua.includes("iPad")) deviceType = "tablet";

            await supabase.from("login_history").insert({
                user_id: user.id,
                user_agent: ua,
                browser,
                os,
                device_type: deviceType,
                success,
            });
        } catch (e) {
            console.error("Failed to track login:", e);
        }
    };

    const onSubmit = async (values: z.infer<typeof signInSchema>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) {
                await trackLogin(false);
                if (error.message.includes("Invalid login credentials")) {
                    toast({
                        title: "Invalid credentials",
                        description: "Please check your email and password and try again.",
                        variant: "destructive",
                    });
                } else if (error.message.includes("Email not confirmed")) {
                    toast({
                        title: "Email not verified",
                        description: "Please check your email and click the verification link.",
                        variant: "destructive",
                    });
                } else {
                    throw error;
                }
            } else if (data.session) {
                await trackLogin(true);
                onSuccess(data.session);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <AuthHeader
                title="Welcome back"
                description="Sign in to access your dashboard"
            />

            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
            >
                {googleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                )}
                Continue with Google
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="you@example.com" {...field} disabled={loading} />
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
                                <div className="flex items-center justify-between">
                                    <FormLabel>Password</FormLabel>
                                    <button
                                        type="button"
                                        onClick={onForgotPassword}
                                        className="text-xs text-primary hover:underline font-medium"
                                        tabIndex={-1}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                    type="button"
                    onClick={onToggleMode}
                    className="text-primary hover:underline font-medium"
                >
                    Sign up
                </button>
            </p>
        </div>
    );
}
