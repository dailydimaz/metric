import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface UpgradeStateProps {
    title: string;
    description: string;
}

export function UpgradeState({ title, description }: UpgradeStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-100/50 py-16 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-base-200 mb-6">
                <Lock className="h-8 w-8 text-base-content/40" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-base-content/60 max-w-sm mb-8">
                {description}
            </p>
            <Button asChild>
                <Link to="/settings/billing">Upgrade Plan</Link>
            </Button>
        </div>
    );
}
