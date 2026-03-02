"use client";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export function ScoreBadge({ score, size = "lg" }: ScoreBadgeProps) {
  let ringColor: string;
  let textColor: string;
  let bgColor: string;
  let label: string;

  if (score >= 70) {
    ringColor = "stroke-green-500";
    textColor = "text-green-600 dark:text-green-400";
    bgColor = "bg-green-50 dark:bg-green-950/30";
    label = "Safe";
  } else if (score >= 40) {
    ringColor = "stroke-yellow-500";
    textColor = "text-yellow-600 dark:text-yellow-400";
    bgColor = "bg-yellow-50 dark:bg-yellow-950/30";
    label = "Caution";
  } else {
    ringColor = "stroke-red-500";
    textColor = "text-red-600 dark:text-red-400";
    bgColor = "bg-red-50 dark:bg-red-950/30";
    label = "Danger";
  }

  const isLarge = size === "lg";
  const svgSize = isLarge ? 96 : 64;
  const radius = isLarge ? 38 : 24;
  const strokeWidth = isLarge ? 5 : 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${bgColor}`}>
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-zinc-200 dark:stroke-zinc-700"
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={`${ringColor} transition-all duration-1000 ease-out`}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-bold ${textColor} ${
            isLarge ? "text-2xl" : "text-base"
          }`}
        >
          {score}
        </span>
      </div>
      <span className={`text-xs font-semibold uppercase tracking-wide ${textColor}`}>
        {label}
      </span>
    </div>
  );
}
