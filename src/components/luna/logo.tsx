import { cn } from "@/lib/utils";

/**
 * Logo Luna AI : croissant de lune + chevron de code.
 * SVG inline pour éviter toute dépendance réseau.
 */
export function LunaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="luna-grad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path
        d="M20.6 3.2C12.9 4.4 7 11.1 7 19.2c0 4.5 1.9 8.5 4.9 11.4C6.3 29 2 23.5 2 17 2 9.3 8.3 3.2 16 3.2c1.6 0 3.2.3 4.6.8Z"
        fill="url(#luna-grad)"
      />
      <path
        d="M14 8l4 6-4 6"
        stroke="#E4E4E7"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx="24.5" cy="20" r="1.6" fill="#818CF8" />
    </svg>
  );
}

export function LunaLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      <LunaMark className={markClassName} />
      <span className="font-semibold tracking-tight text-zinc-100">
        Luna<span className="text-violet-400"> AI</span>
      </span>
    </span>
  );
}
