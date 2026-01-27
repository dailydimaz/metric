import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, CheckCircle2, Code, Database, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface LookerStudioCardProps {
    siteId: string;
    apiKey?: string;
}

export function LookerStudioCard({ siteId, apiKey }: LookerStudioCardProps) {
    const { toast } = useToast();
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiEndpoint = `${supabaseUrl}/functions/v1/bi-query`;
    const schemaEndpoint = `${apiEndpoint}/schema`;

    const copyToClipboard = async (text: string, fieldName: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast({ title: "Copied", description: `${fieldName} copied to clipboard` });
        setTimeout(() => setCopiedField(null), 2000);
    };

    const exampleRequest = `curl -X POST "${apiEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "site_id": "${siteId}",
    "dimensions": ["date", "country"],
    "metrics": ["pageviews", "visitors"],
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }'`;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            BI Tools Connector
                        </CardTitle>
                        <CardDescription>
                            Connect your analytics data to Looker Studio, Tableau, Power BI, or any BI tool.
                        </CardDescription>
                    </div>
                    <Badge variant="secondary">REST API</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Tabs defaultValue="setup" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="setup">Setup</TabsTrigger>
                        <TabsTrigger value="schema">Schema</TabsTrigger>
                        <TabsTrigger value="example">Example</TabsTrigger>
                    </TabsList>

                    <TabsContent value="setup" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>API Endpoint</Label>
                                <div className="flex items-center space-x-2">
                                    <Input value={apiEndpoint} readOnly className="font-mono text-xs" />
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => copyToClipboard(apiEndpoint, 'API Endpoint')}
                                    >
                                        {copiedField === 'API Endpoint' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Site ID</Label>
                                <div className="flex items-center space-x-2">
                                    <Input value={siteId} readOnly className="font-mono" />
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => copyToClipboard(siteId, 'Site ID')}
                                    >
                                        {copiedField === 'Site ID' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Use this Site ID in your API requests
                                </p>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    Authentication
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Include your API key in the <code className="bg-muted px-1 rounded">x-api-key</code> header.
                                    Generate an API key in the API Keys section above.
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="schema" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <div className="bg-muted/30 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-3">Available Dimensions</h4>
                                <div className="flex flex-wrap gap-2">
                                    {['date', 'url', 'referrer', 'country', 'city', 'browser', 'os', 'device_type', 'event_name', 'utm_source', 'utm_medium', 'utm_campaign'].map(dim => (
                                        <Badge key={dim} variant="outline" className="font-mono text-xs">
                                            {dim}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-3">Available Metrics</h4>
                                <div className="flex flex-wrap gap-2">
                                    {['pageviews', 'visitors', 'sessions', 'bounces', 'bounce_rate', 'avg_session_duration'].map(metric => (
                                        <Badge key={metric} variant="secondary" className="font-mono text-xs">
                                            {metric}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => window.open(schemaEndpoint, '_blank')}
                            >
                                <Code className="h-4 w-4 mr-2" />
                                View Full Schema (JSON)
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="example" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Example cURL Request</Label>
                            <div className="relative">
                                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono">
                                    <code>{exampleRequest}</code>
                                </pre>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(exampleRequest, 'Example')}
                                >
                                    {copiedField === 'Example' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-medium">Response Format</h4>
                            <pre className="text-xs font-mono text-muted-foreground">
{`{
  "schema": [...],
  "rows": [
    { "date": "2024-01-01", "country": "US", "pageviews": 1234, "visitors": 567 },
    ...
  ],
  "rowCount": 31
}`}
                            </pre>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="pt-4 border-t space-y-3">
                    <p className="text-xs text-muted-foreground">
                        Use this API endpoint with any BI tool that supports REST data sources.
                    </p>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => window.open('https://lookerstudio.google.com/', '_blank')}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Looker Studio
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
