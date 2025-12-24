import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSites } from "@/hooks/useSites";
import { Loader2 } from "lucide-react";

interface CreateSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSiteDialog({ open, onOpenChange }: CreateSiteDialogProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const { createSite } = useSites();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const site = await createSite.mutateAsync({ name, domain });
      onOpenChange(false);
      setName("");
      setDomain("");
      navigate(`/dashboard/sites/${site.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <dialog ref={modalRef} className="modal" onClose={() => onOpenChange(false)}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Create a new site</h3>
        <p className="py-2 text-base-content/70">
          Add a new website or application to track with Metric.
        </p>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Site name</span>
            </label>
            <input
              type="text"
              placeholder="My Website"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-control w-full mt-4">
            <label className="label">
              <span className="label-text">Domain (optional)</span>
            </label>
            <input
              type="text"
              placeholder="example.com"
              className="input input-bordered w-full"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                The domain where your site is hosted
              </span>
            </label>
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!name || createSite.isPending}
            >
              {createSite.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create site
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => onOpenChange(false)}>close</button>
      </form>
    </dialog>
  );
}
