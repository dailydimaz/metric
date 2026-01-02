import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { KeyRound, Loader2, Copy, Check, RefreshCw, Eye, EyeOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface BackupCode {
  id: string;
  code_hash: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

// Generate cryptographically secure random backup codes
const generateCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  
  for (let i = 0; i < count; i++) {
    // Use crypto.getRandomValues for cryptographically secure randomness
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    
    const code = Array.from(randomBytes)
      .map(byte => charset[byte % charset.length])
      .join("");
    
    codes.push(code.slice(0, 4) + "-" + code.slice(4));
  }
  return codes;
};

// Simple hash function for backup codes
const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.replace("-", "").toUpperCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

export function BackupCodes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [has2FA, setHas2FA] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBackupCodes();
      check2FAStatus();
    }
  }, [user]);

  const check2FAStatus = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const verifiedFactors = data?.totp?.filter(f => f.status === 'verified') || [];
    setHas2FA(verifiedFactors.length > 0);
  };

  const fetchBackupCodes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("backup_codes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBackupCodes(data || []);
    } catch (error: any) {
      console.error("Error fetching backup codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCodes = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      // Delete existing codes
      await supabase
        .from("backup_codes")
        .delete()
        .eq("user_id", user.id);

      // Generate new codes
      const newCodes = generateCodes(10);
      setGeneratedCodes(newCodes);

      // Hash and store codes
      const hashedCodes = await Promise.all(
        newCodes.map(async (code) => ({
          user_id: user.id,
          code_hash: await hashCode(code),
          used: false,
        }))
      );

      const { error } = await supabase
        .from("backup_codes")
        .insert(hashedCodes);

      if (error) throw error;

      toast({
        title: "Backup codes generated",
        description: "Save these codes in a secure location",
      });

      setShowGenerateDialog(true);
      await fetchBackupCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate backup codes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generatedCodes.join("\n"));
    toast({
      title: "Copied",
      description: "All backup codes copied to clipboard",
    });
  };

  const handleDownload = () => {
    const content = `mmmetric Backup Codes\n${"=".repeat(30)}\n\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes safe. Each code can only be used once.\n\n${generatedCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mmmetric-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const unusedCount = backupCodes.filter(c => !c.used).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Backup Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!has2FA) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Backup Codes
          </CardTitle>
          <CardDescription>
            Recovery codes for when you lose access to your authenticator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable two-factor authentication first to generate backup codes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Backup Codes
          </CardTitle>
          <CardDescription>
            Recovery codes for when you lose access to your authenticator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backupCodes.length > 0 ? (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">
                    {unusedCount} of {backupCodes.length} codes remaining
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Generated on {new Date(backupCodes[0].created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCodes(!showCodes)}
                  >
                    {showCodes ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {showCodes && (
                <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg bg-muted/30">
                  {backupCodes.map((code, index) => (
                    <div
                      key={code.id}
                      className={`p-2 rounded text-center font-mono text-sm ${
                        code.used
                          ? "text-muted-foreground line-through bg-muted"
                          : "bg-background"
                      }`}
                    >
                      {code.used ? "Used" : `Code ${index + 1}`}
                    </div>
                  ))}
                </div>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Codes
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate backup codes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will invalidate all existing backup codes and generate new ones.
                      Make sure to save the new codes in a secure location.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGenerateCodes} disabled={generating}>
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Regenerate"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Generate backup codes to use when you don't have access to your authenticator app.
              </p>
              <Button onClick={handleGenerateCodes} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Generate Backup Codes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Backup Codes</DialogTitle>
            <DialogDescription>
              Store these codes in a safe place. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
            {generatedCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-background rounded"
              >
                <code className="font-mono text-sm">{code}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopyCode(code, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCopyAll} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy All
            </Button>
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => setShowGenerateDialog(false)} className="flex-1">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
