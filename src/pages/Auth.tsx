import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { z } from "zod";
import mmmetricLogo from "@/assets/mmmetric-logo.png";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
});

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type AuthMode = "signin" | "signup" | "forgot-password" | "check-email";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSentTo, setEmailSentTo] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // MFA state
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [verifyingMfa, setVerifyingMfa] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkMfaRequired(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !showMfaChallenge) {
        checkMfaRequired(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, showMfaChallenge]);

  const checkMfaRequired = async (session: any) => {
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];
    
    if (verifiedFactors.length > 0) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        setMfaFactorId(verifiedFactors[0].id);
        setShowMfaChallenge(true);
        return;
      }
    }
    
    // Check for pending invite token and redirect there
    const pendingInviteToken = sessionStorage.getItem("pendingInviteToken");
    if (pendingInviteToken) {
      sessionStorage.removeItem("pendingInviteToken");
      navigate(`/invite/${pendingInviteToken}`);
      return;
    }
    
    navigate("/dashboard");
  };

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

  const validateForm = () => {
    try {
      if (mode === "forgot-password") {
        emailSchema.parse({ email });
      } else {
        authSchema.parse({ email, password, fullName: mode === "signup" ? fullName : undefined });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSentTo(email);
      setMode("check-email");
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "forgot-password") {
      return handleForgotPassword();
    }

    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
            setMode("signin");
          } else {
            throw error;
          }
        } else {
          setEmailSentTo(email);
          setMode("check-email");
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account.",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
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
          await checkMfaRequired(data.session);
        }
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

  const handleResendEmail = async () => {
    if (!emailSentTo) return;
    
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailSentTo,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      toast({
        title: "Email resent",
        description: "Check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId || mfaCode.length !== 6) return;

    setVerifyingMfa(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "Verified",
        description: "Two-factor authentication successful",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
      setMfaCode("");
    } finally {
      setVerifyingMfa(false);
    }
  };

  // Check email verification / password reset sent screen
  if (mode === "check-email") {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm text-center">
            <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
              <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
              <span className="font-display text-xl font-bold">mmmetric</span>
            </Link>

            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>

            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="mt-2 text-base-content/70">
              We've sent a verification link to
            </p>
            <p className="font-medium text-base-content mt-1">{emailSentTo}</p>

            <div className="mt-8 p-4 rounded-lg bg-base-200/50 text-left">
              <h3 className="font-medium text-sm mb-2">Didn't receive the email?</h3>
              <ul className="text-sm text-base-content/70 space-y-1">
                <li>• Check your spam folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleResendEmail}
              className="btn btn-outline w-full mt-6"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend email
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setEmailSentTo("");
              }}
              className="mt-4 flex items-center justify-center gap-2 text-sm text-base-content/70 hover:text-base-content w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary mb-8">
              <CheckCircle className="h-10 w-10 text-primary-content" />
            </div>
            <h2 className="text-2xl font-bold">Almost there!</h2>
            <p className="mt-4 text-base-content/70">
              Click the link in your email to verify your account and start tracking your analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showMfaChallenge) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
              <span className="font-display text-xl font-bold">mmmetric</span>
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
                <p className="text-base-content/70 text-sm">
                  Enter the code from your authenticator app
                </p>
              </div>
            </div>

            <form onSubmit={handleMfaVerify} className="space-y-4">
              <div className="form-control w-full">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  className="input input-bordered w-full text-center text-3xl tracking-[0.5em] font-mono"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  disabled={verifyingMfa}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={verifyingMfa || mfaCode.length !== 6}
              >
                {verifyingMfa && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setShowMfaChallenge(false);
                setMfaCode("");
                supabase.auth.signOut();
              }}
              className="mt-4 text-center text-sm text-base-content/70 hover:text-base-content w-full"
            >
              Cancel and sign out
            </button>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary mb-8">
              <Shield className="h-10 w-10 text-primary-content" />
            </div>
            <h2 className="text-2xl font-bold">Your account is protected</h2>
            <p className="mt-4 text-base-content/70">
              Two-factor authentication adds an extra layer of security to your account.
              Open your authenticator app to get your verification code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password form
  if (mode === "forgot-password") {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
              <span className="font-display text-xl font-bold">mmmetric</span>
            </Link>

            <button
              type="button"
              onClick={() => setMode("signin")}
              className="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>

            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="mt-2 text-base-content/70">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                {errors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.email}</span>
                  </label>
                )}
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary mb-8">
              <Mail className="h-10 w-10 text-primary-content" />
            </div>
            <h2 className="text-2xl font-bold">Forgot your password?</h2>
            <p className="mt-4 text-base-content/70">
              No worries! Enter your email and we'll send you instructions to reset your password securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-xl font-bold">mmmetric</span>
          </Link>

          <h1 className="text-2xl font-bold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-base-content/70">
            {mode === "signup"
              ? "Start tracking your analytics in minutes"
              : "Sign in to access your dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Full name</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className={`input input-bordered w-full ${errors.fullName ? "input-error" : ""}`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
                {errors.fullName && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.fullName}</span>
                  </label>
                )}
              </div>
            )}

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.email}</span>
                </label>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Password</span>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="label-text-alt link link-primary"
                  >
                    Forgot password?
                  </button>
                )}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password}</span>
                </label>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-base-content/70">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="link link-primary font-medium"
            >
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <img src={mmmetricLogo} alt="mmmetric" className="inline-flex h-20 w-20 rounded-2xl mb-8" />
          <h2 className="text-2xl font-bold">Privacy-first analytics</h2>
          <p className="mt-4 text-base-content/70">
            Get powerful insights without compromising your users' privacy. 
            GDPR compliant, no cookies required.
          </p>
          <div className="stats stats-vertical sm:stats-horizontal shadow mt-8">
            <div className="stat">
              <div className="stat-value">10K+</div>
              <div className="stat-desc">Websites tracked</div>
            </div>
            <div className="stat">
              <div className="stat-value">1B+</div>
              <div className="stat-desc">Events processed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
