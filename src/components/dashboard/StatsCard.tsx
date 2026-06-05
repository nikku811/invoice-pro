import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className = "",
}: StatsCardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-200/80 dark:hover:border-slate-700/80 transition-all duration-350 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            {value}
          </h3>
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
          {icon}
        </div>
      </div>

      {(description || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 text-xs">
          {trend && (
            <span
              className={`font-bold inline-flex items-center gap-0.5 ${
                trend.isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
