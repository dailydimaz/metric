import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type InviteStatus = "loading" | "valid" | "invalid" | "expired" | "accepted" | "error";

interface InvitationDetails {
  email: string;
  role: string;
  siteName: string;
  siteId: string;
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<InviteStatus>("loading");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const fetchInvitation = async () => {
      try {
        // Look up the invitation by token
        const { data: inviteData, error: inviteError } = await supabase
          .from("team_invitations")
          .select("*, sites(name)")
          .eq("token", token)
          .single();

        if (inviteError || !inviteData) {
          setStatus("invalid");
          return;
        }

        // Check if already accepted
        if (inviteData.accepted_at) {
          setStatus("accepted");
          return;
        }

        // Check if expired
        if (new Date(inviteData.expires_at) < new Date()) {
          setStatus("expired");
          return;
        }

        setInvitation({
          email: inviteData.email,
          role: inviteData.role,
          siteName: (inviteData.sites as any)?.name || "Unknown Site",
          siteId: inviteData.site_id,
        });
        setStatus("valid");
      } catch {
        setStatus("error");
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!user || !token || !invitation) return;

    // Verify user's email matches the invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      toast({
        title: "Email mismatch",
        description: `This invitation was sent to ${invitation.email}. Please log in with that email address.`,
        variant: "destructive",
      });
      return;
    }

    setAccepting(true);
    try {
      // Add user as team member
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          site_id: invitation.siteId,
          user_id: user.id,
          role: invitation.role,
        });

      if (memberError) {
        if (memberError.code === "23505") {
          toast({
            title: "Already a member",
            description: "You're already a member of this team",
          });
          navigate("/dashboard");
          return;
        }
        throw memberError;
      }

      // Mark invitation as accepted
      await supabase
        .from("team_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("token", token);

      toast({
        title: "Welcome to the team!",
        description: `You now have ${invitation.role} access to ${invitation.siteName}`,
      });

      navigate(`/dashboard/sites/${invitation.siteId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleLoginRedirect = () => {
    // Store token in sessionStorage so we can redirect back after login
    sessionStorage.setItem("pendingInviteToken", token || "");
    navigate("/auth");
  };

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {status === "valid" && invitation && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Team Invitation</CardTitle>
              <CardDescription>
                You've been invited to join <strong>{invitation.siteName}</strong> as a{" "}
                <strong>{invitation.role}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Logged in as <strong>{user.email}</strong>
                  </p>
                  <Button
                    onClick={handleAcceptInvitation}
                    disabled={accepting}
                    className="w-full"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      "Accept Invitation"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Please log in or create an account to accept this invitation
                  </p>
                  <Button onClick={handleLoginRedirect} className="w-full">
                    Log In / Sign Up
                  </Button>
                </>
              )}
            </CardContent>
          </>
        )}

        {status === "invalid" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Invalid Invitation</CardTitle>
              <CardDescription>
                This invitation link is invalid or has been revoked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Go to Home
              </Button>
            </CardContent>
          </>
        )}

        {status === "expired" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>Invitation Expired</CardTitle>
              <CardDescription>
                This invitation has expired. Please request a new one from the team admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Go to Home
              </Button>
            </CardContent>
          </>
        )}

        {status === "accepted" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>Already Accepted</CardTitle>
              <CardDescription>
                This invitation has already been accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                Unable to load invitation. Please try again later
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Go to Home
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
