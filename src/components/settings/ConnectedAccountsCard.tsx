import { useState, useEffect } from "react";
import { Loader2, Link2, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/googleAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Identity {
  id: string;
  provider: string;
  identity_data?: {
    email?: string;
    full_name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

export function ConnectedAccountsCard() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchIdentities();
  }, []);

  const fetchIdentities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.identities) {
      setIdentities(user.identities as Identity[]);
    }
    setLoading(false);
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      const { error } = await signInWithGoogle("/dashboard/settings");
      if (error) {
        toast({
          title: "Failed to link Google",
          description: error.message || "Could not connect Google account",
          variant: "destructive",
        });
      }
      // The page will redirect, so we don't need to do anything else
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleUnlinkProvider = async (provider: string, identityId: string) => {
    // Check if this is the only identity
    if (identities.length <= 1) {
      toast({
        title: "Cannot unlink",
        description: "You must have at least one sign-in method connected",
        variant: "destructive",
      });
      return;
    }

    // Check if user has a password set (email provider)
    const hasEmailProvider = identities.some(i => i.provider === "email");
    const isUnlinkingEmail = provider === "email";
    
    if (!hasEmailProvider && !isUnlinkingEmail) {
      // User only has OAuth, warn them
      const hasMultipleOAuth = identities.filter(i => i.provider !== "email").length > 1;
      if (!hasMultipleOAuth) {
        toast({
          title: "Cannot unlink",
          description: "You need to set a password or link another account first",
          variant: "destructive",
        });
        return;
      }
    }

    setUnlinkingProvider(provider);
    try {
      const { error } = await supabase.auth.unlinkIdentity({ 
        provider, 
        id: identityId 
      } as any);
      
      if (error) {
        toast({
          title: "Failed to unlink",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account unlinked",
          description: `${provider} has been disconnected from your account`,
        });
        await fetchIdentities();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unlink account",
        variant: "destructive",
      });
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const isGoogleConnected = identities.some(i => i.provider === "google");
  const googleIdentity = identities.find(i => i.provider === "google");

  const getProviderIcon = (provider: string) => {
    if (provider === "google") {
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
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
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Connected Accounts
        </CardTitle>
        <CardDescription>
          Link your social accounts for faster sign-in. You can use any connected account to access your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Connection */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getProviderIcon("google")}
            <div>
              <p className="font-medium">Google</p>
              {isGoogleConnected && googleIdentity?.identity_data?.email ? (
                <p className="text-sm text-muted-foreground">
                  {googleIdentity.identity_data.email}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
          </div>
          
          {isGoogleConnected ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={unlinkingProvider === "google"}
                >
                  {unlinkingProvider === "google" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-2" />
                  )}
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Google Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You won't be able to sign in with Google anymore. Make sure you have a password set or another connected account before disconnecting.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleUnlinkProvider("google", googleIdentity?.id || "")}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLinkGoogle}
              disabled={linkingGoogle}
            >
              {linkingGoogle ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Connect
            </Button>
          )}
        </div>

        {/* Info about connected accounts */}
        {identities.length > 0 && (
          <p className="text-xs text-muted-foreground">
            You have {identities.length} connected sign-in method{identities.length > 1 ? "s" : ""}.
            {identities.length === 1 && " Add another method to ensure account access."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
