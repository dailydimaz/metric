import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShieldCheck, Plus, Trash2, Copy, ExternalLink, Settings2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useSSOProviders, SSOProviderType, SSOProvider } from "@/hooks/useSSOProviders";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

interface SSOConfigCardProps {
  siteId: string;
}

const PROVIDER_LABELS: Record<SSOProviderType, string> = {
  saml: "SAML 2.0 (Generic)",
  google_workspace: "Google Workspace",
  okta: "Okta",
  azure_ad: "Microsoft Azure AD",
};

const PROVIDER_ICONS: Record<SSOProviderType, string> = {
  saml: "🔐",
  google_workspace: "🔷",
  okta: "🟣",
  azure_ad: "🔷",
};

export function SSOConfigCard({ siteId }: SSOConfigCardProps) {
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const { 
    providers, 
    isLoading, 
    createProvider, 
    updateProvider, 
    deleteProvider, 
    toggleProvider,
    getSpMetadataUrl,
    getAcsUrl,
    getSsoLoginUrl,
  } = useSSOProviders(siteId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);

  // Form state for new provider
  const [newProviderType, setNewProviderType] = useState<SSOProviderType>("saml");
  const [newDomain, setNewDomain] = useState("");
  const [newEntryPoint, setNewEntryPoint] = useState("");
  const [newIssuer, setNewIssuer] = useState("");
  const [newCert, setNewCert] = useState("");
  const [newMetadataXml, setNewMetadataXml] = useState("");

  // Edit form state
  const [editEntryPoint, setEditEntryPoint] = useState("");
  const [editIssuer, setEditIssuer] = useState("");
  const [editCert, setEditCert] = useState("");
  const [editMetadataXml, setEditMetadataXml] = useState("");

  // Enterprise tier check - business plan and above gets SSO
  const isEnterprise = subscription?.plan === "business" || subscription?.plan === "pro";

  const resetNewForm = () => {
    setNewProviderType("saml");
    setNewDomain("");
    setNewEntryPoint("");
    setNewIssuer("");
    setNewCert("");
    setNewMetadataXml("");
  };

  const handleCreateProvider = () => {
    if (!newDomain.trim()) {
      toast({
        title: "Domain required",
        description: "Please enter the email domain for SSO.",
        variant: "destructive",
      });
      return;
    }

    createProvider.mutate({
      site_id: siteId,
      provider_type: newProviderType,
      domain: newDomain.trim().toLowerCase(),
      entry_point: newEntryPoint.trim() || undefined,
      issuer: newIssuer.trim() || undefined,
      cert: newCert.trim() || undefined,
      metadata_xml: newMetadataXml.trim() || undefined,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        resetNewForm();
      },
    });
  };

  const handleOpenConfig = (provider: SSOProvider) => {
    setSelectedProvider(provider);
    setEditEntryPoint(provider.entry_point || "");
    setEditIssuer(provider.issuer || "");
    setEditCert(provider.cert || "");
    setEditMetadataXml(provider.metadata_xml || "");
    setIsConfigDialogOpen(true);
  };

  const handleUpdateProvider = () => {
    if (!selectedProvider) return;

    updateProvider.mutate({
      id: selectedProvider.id,
      entry_point: editEntryPoint.trim() || undefined,
      issuer: editIssuer.trim() || undefined,
      cert: editCert.trim() || undefined,
      metadata_xml: editMetadataXml.trim() || undefined,
    }, {
      onSuccess: () => {
        setIsConfigDialogOpen(false);
        setSelectedProvider(null);
      },
    });
  };

  const handleDeleteProvider = (id: string) => {
    deleteProvider.mutate(id, {
      onSuccess: () => setDeleteConfirmId(null),
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  if (!isEnterprise) {
    return (
      <Card className="opacity-75">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            SSO / SAML
            <Badge variant="secondary">Enterprise</Badge>
          </CardTitle>
          <CardDescription>Configure Single Sign-On for your team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center space-y-4">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-medium">Enterprise Only</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                SSO via Google Workspace, Okta, Azure AD, and custom SAML providers is available on the Enterprise plan.
              </p>
            </div>
            <Button variant="outline">Contact Sales to Upgrade</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              SSO / SAML
            </span>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add SSO Provider</DialogTitle>
                  <DialogDescription>
                    Configure a new identity provider for single sign-on authentication.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provider Type</Label>
                      <Select value={newProviderType} onValueChange={(v) => setNewProviderType(v as SSOProviderType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {PROVIDER_ICONS[value as SSOProviderType]} {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Domain</Label>
                      <Input
                        placeholder="company.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Users with this email domain will use SSO.
                      </p>
                    </div>
                  </div>

                  <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manual">Manual Configuration</TabsTrigger>
                      <TabsTrigger value="metadata">Import Metadata</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>IdP SSO URL (Entry Point)</Label>
                        <Input
                          placeholder="https://idp.example.com/sso/saml"
                          value={newEntryPoint}
                          onChange={(e) => setNewEntryPoint(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IdP Issuer / Entity ID</Label>
                        <Input
                          placeholder="https://idp.example.com"
                          value={newIssuer}
                          onChange={(e) => setNewIssuer(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IdP X.509 Certificate</Label>
                        <Textarea
                          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                          className="font-mono text-xs h-32"
                          value={newCert}
                          onChange={(e) => setNewCert(e.target.value)}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="metadata" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>IdP Metadata XML</Label>
                        <Textarea
                          placeholder="Paste your IdP metadata XML here..."
                          className="font-mono text-xs h-48"
                          value={newMetadataXml}
                          onChange={(e) => setNewMetadataXml(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          The metadata will be parsed to extract SSO URL, issuer, and certificate automatically.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProvider} disabled={createProvider.isPending}>
                    {createProvider.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Provider
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Configure enterprise single sign-on with SAML 2.0 identity providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center space-y-4">
              <ShieldCheck className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="font-medium">No SSO Providers</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Add an identity provider to enable single sign-on for your team members.
                </p>
              </div>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {providers.map((provider) => (
                <AccordionItem key={provider.id} value={provider.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-xl">{PROVIDER_ICONS[provider.provider_type]}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{provider.domain}</span>
                          {provider.is_enabled ? (
                            <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {PROVIDER_LABELS[provider.provider_type]}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`enable-${provider.id}`}>Enable SSO</Label>
                      </div>
                      <Switch
                        id={`enable-${provider.id}`}
                        checked={provider.is_enabled}
                        onCheckedChange={(checked) => toggleProvider.mutate({ id: provider.id, is_enabled: checked })}
                        disabled={toggleProvider.isPending}
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Service Provider (SP) Details</h4>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                          <span className="text-muted-foreground">ACS URL:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-background px-2 py-1 rounded">
                              {getAcsUrl(provider.id)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(getAcsUrl(provider.id), "ACS URL")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                          <span className="text-muted-foreground">Metadata URL:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-background px-2 py-1 rounded truncate max-w-[300px]">
                              {getSpMetadataUrl(provider.id)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(getSpMetadataUrl(provider.id), "Metadata URL")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                          <span className="text-muted-foreground">Login URL:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-background px-2 py-1 rounded truncate max-w-[300px]">
                              {getSsoLoginUrl(provider.id)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(getSsoLoginUrl(provider.id), "Login URL")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenConfig(provider)}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(getSsoLoginUrl(provider.id), "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Test Login
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirmId(provider.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Edit Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure SSO Provider</DialogTitle>
            <DialogDescription>
              Update the identity provider configuration for {selectedProvider?.domain}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>IdP SSO URL (Entry Point)</Label>
              <Input
                placeholder="https://idp.example.com/sso/saml"
                value={editEntryPoint}
                onChange={(e) => setEditEntryPoint(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>IdP Issuer / Entity ID</Label>
              <Input
                placeholder="https://idp.example.com"
                value={editIssuer}
                onChange={(e) => setEditIssuer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>IdP X.509 Certificate</Label>
              <Textarea
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                className="font-mono text-xs h-32"
                value={editCert}
                onChange={(e) => setEditCert(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>IdP Metadata XML (Optional)</Label>
              <Textarea
                placeholder="Paste your IdP metadata XML here..."
                className="font-mono text-xs h-32"
                value={editMetadataXml}
                onChange={(e) => setEditMetadataXml(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProvider} disabled={updateProvider.isPending}>
              {updateProvider.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SSO Provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the SSO configuration and users will no longer be able to sign in with this provider. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDeleteProvider(deleteConfirmId)}
            >
              {deleteProvider.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
