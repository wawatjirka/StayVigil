"use client";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export function ScoreBadge({ score, size = "lg" }: ScoreBadgeProps) {
  let ringColor: string;
  let textColor: string;
  let label: string;

  if (score >= 70) {
    ringColor = "stroke-[hsl(120,100%,50%)]";
    textColor = "text-primary";
    label = "SAFE";
  } else if (score >= 40) {
    ringColor = "stroke-[hsl(60,100%,50%)]";
    textColor = "text-accent";
    label = "DEGEN";
  } else {
    ringColor = "stroke-[hsl(0,100%,50%)]";
    textColor = "text-destructive";
    label = "REKT";
  }

  const isLarge = size === "lg";
  const svgSize = isLarge ? 96 : 64;
  const radius = isLarge ? 38 : 24;
  const strokeWidth = isLarge ? 5 : 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5 p-3 border border-primary/20 bg-black/40">
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-primary/20"
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={`${ringColor} transition-all duration-1000 ease-out`}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-bold font-mono ${textColor} ${
            isLarge ? "text-2xl" : "text-base"
          }`}
        >
          {score}
        </span>
      </div>
      <span
        className={`text-xs font-bold uppercase tracking-widest font-display ${textColor}`}
      >
        {label}
      </span>
    </div>
  );
}
