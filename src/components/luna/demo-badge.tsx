import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Badge « Mode démo » — signale visuellement des données démonstration. */
export function DemoBadge({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/10",
              className
            )}
          >
            <FlaskConical className="h-3 w-3" aria-hidden="true" />
            {compact ? "Démo" : "Mode démo"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-72 text-xs">
          Données de démonstration — aucune authentification Roblox réelle n&apos;a été effectuée.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
