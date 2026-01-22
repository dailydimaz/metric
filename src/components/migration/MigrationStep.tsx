import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface MigrationStepProps {
  children: ReactNode;
  title: string;
  description?: string;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
  showNext?: boolean;
}

export function MigrationStep({
  children,
  title,
  description,
  onNext,
  onBack,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled = false,
  loading = false,
  showBack = true,
  showNext = true,
}: MigrationStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      <div className="min-h-[300px]">{children}</div>

      <div className="flex justify-between pt-6 border-t border-border">
        {showBack ? (
          <Button variant="ghost" onClick={onBack} disabled={loading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        ) : (
          <div />
        )}

        {showNext && (
          <Button onClick={onNext} disabled={nextDisabled || loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {nextLabel}
            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
