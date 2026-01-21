import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface ImportJob {
  id: string;
  user_id: string;
  site_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  file_name: string;
  file_size: number;
  total_records: number;
  processed_records: number;
  failed_records: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ImportData {
  exported_at?: string;
  user_id?: string;
  user_email?: string;
  sites?: any[];
  events?: any[];
  goals?: any[];
  funnels?: any[];
}

export function useDataImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // Fetch import jobs for the user
  const { data: importJobs, isLoading } = useQuery({
    queryKey: ["import-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("import_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ImportJob[];
    },
    enabled: !!user,
    refetchInterval: (query) => {
      // Refetch every 2 seconds if there's a processing job
      const jobs = query.state.data as ImportJob[] | undefined;
      const hasProcessing = jobs?.some(
        (job) => job.status === "pending" || job.status === "processing"
      );
      return hasProcessing ? 2000 : false;
    },
  });

  // Start import mutation
  const startImport = useMutation({
    mutationFn: async ({
      file,
      targetSiteId,
    }: {
      file: File;
      targetSiteId: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      setUploading(true);

      try {
        // Parse the JSON file
        const content = await file.text();
        let importData: ImportData;
        
        try {
          importData = JSON.parse(content);
        } catch {
          throw new Error("Invalid JSON file. Please upload a valid export file.");
        }

        // Validate the import data structure
        if (!importData || typeof importData !== "object") {
          throw new Error("Invalid import file format");
        }

        const hasData =
          (importData.events && importData.events.length > 0) ||
          (importData.goals && importData.goals.length > 0) ||
          (importData.funnels && importData.funnels.length > 0);

        if (!hasData) {
          throw new Error(
            "No importable data found. The file should contain events, goals, or funnels."
          );
        }

        // Create import job record
        const { data: job, error: jobError } = await supabase
          .from("import_jobs")
          .insert({
            user_id: user.id,
            site_id: targetSiteId,
            file_name: file.name,
            file_size: file.size,
            status: "pending",
            total_records:
              (importData.events?.length || 0) +
              (importData.goals?.length || 0) +
              (importData.funnels?.length || 0),
          })
          .select()
          .single();

        if (jobError) throw jobError;

        // Call edge function to start processing
        const { data, error } = await supabase.functions.invoke("import-data", {
          body: {
            jobId: job.id,
            siteId: targetSiteId,
            importData,
          },
        });

        if (error) {
          // Mark job as failed
          await supabase
            .from("import_jobs")
            .update({
              status: "failed",
              error_message: error.message,
            })
            .eq("id", job.id);
          throw error;
        }

        return { job, response: data };
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Import started",
        description: "Your data is being imported in the background.",
      });
      queryClient.invalidateQueries({ queryKey: ["import-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    importJobs,
    isLoading,
    uploading,
    startImport,
  };
}
