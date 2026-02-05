import { cn } from "@/lib/utils";

interface OpsCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    status?: "active" | "inactive" | "warning" | "danger";
    children: React.ReactNode;
}

export function OpsCard({ title, subtitle, status = "active", className, children, ...props }: OpsCardProps) {
    const statusColors = {
        active: "text-primary border-primary/30",
        inactive: "text-muted-foreground border-border",
        warning: "text-ops-warning border-ops-warning/50",
        danger: "text-destructive border-destructive/50",
    };

    return (
        <div
            className={cn(
                "relative rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm p-6 overflow-hidden transition-all duration-300 hover:border-primary/40 group",
                "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100",
                className
            )}
            {...props}
        >
            {/* Decorative corner markers */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/50 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/50 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/50 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/50 rounded-br-sm" />

            {/* Header */}
            {(title || subtitle) && (
                <div className="mb-6 space-y-1 relative z-10">
                    {title && (
                        <h3 className="font-orbitron text-xl tracking-widest text-primary uppercase drop-shadow-[0_0_5px_rgba(45,212,191,0.3)]">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
