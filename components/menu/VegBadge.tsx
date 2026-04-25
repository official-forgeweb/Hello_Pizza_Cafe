"use client";

interface VegBadgeProps {
  isVeg: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function VegBadge({ isVeg, size = "md", className = "" }: VegBadgeProps) {
  const sizes = {
    sm: { box: "w-3.5 h-3.5", dot: "w-1.5 h-1.5" },
    md: { box: "w-4.5 h-4.5", dot: "w-2 h-2" },
    lg: { box: "w-5 h-5", dot: "w-2.5 h-2.5" },
  };

  const s = sizes[size];
  const color = isVeg ? "border-veg bg-veg" : "border-nonveg bg-nonveg";
  const borderColor = isVeg ? "border-veg" : "border-nonveg";

  return (
    <span
      className={`inline-flex items-center justify-center ${s.box} rounded-[3px] border-2 ${borderColor} ${className}`}
      title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
    >
      <span className={`rounded-full ${s.dot} ${color}`} />
    </span>
  );
}
