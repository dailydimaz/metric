import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    LayoutDashboard,
    Moon,
    Sun,
    Laptop,
    Globe,
    Plus,
    Link,
    GitBranch,
    Users,
    Lightbulb,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useSites } from "@/hooks/useSites";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { sites } = useSites();
    const { setTheme } = useTheme();
    const { user } = useAuth();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!user) return null;

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="General">
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/tools/campaign-builder"))}>
                        <Link className="mr-2 h-4 w-4" />
                        <span>URL Builder</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Theme">
                    <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                        <Laptop className="mr-2 h-4 w-4" />
                        <span>System</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Sites">
                    {sites.map((site) => (
                        <CommandItem
                            key={site.id}
                            value={site.name} // Include name for searching
                            onSelect={() => runCommand(() => navigate(`/dashboard/sites/${site.id}`))}
                            className="cursor-pointer"
                        >
                            <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{site.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground truncate max-w-[100px] font-mono">
                                {site.domain}
                            </span>
                        </CommandItem>
                    ))}
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))} className="text-primary cursor-pointer font-medium">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Add New Site</span>
                    </CommandItem>
                </CommandGroup>

            </CommandList>
        </CommandDialog>
    );
}
