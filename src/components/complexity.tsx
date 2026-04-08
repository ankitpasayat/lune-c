import { Clock, HardDrive } from "lucide-react";

interface ComplexityProps {
  time?: string;   // e.g. "O(n)", "O(n log n)"
  space?: string;  // e.g. "O(1)", "O(n)"
  className?: string;
}

export default function Complexity({ time, space, className = "" }: ComplexityProps) {
  if (!time && !space) return null;

  return (
    <div className={`inline-flex items-center gap-3 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-mono ${className}`}>
      {time && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3 text-primary/70" />
          <span className="text-foreground/80">{time}</span>
        </span>
      )}
      {time && space && (
        <span className="text-border">|</span>
      )}
      {space && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <HardDrive className="h-3 w-3 text-primary/70" />
          <span className="text-foreground/80">{space}</span>
        </span>
      )}
    </div>
  );
}
