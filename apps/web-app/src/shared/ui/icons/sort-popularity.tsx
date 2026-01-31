import React from "react";
import { cn } from "@/infrastructure/lib/utils";

interface IconSortPopularityDescendingProps {
  className?: string;
  size?: number;
}

export function IconSortPopularityDescending({
  className,
  size = 24,
}: IconSortPopularityDescendingProps) {
  return (
    <svg
      className={cn("inline-block", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Main arrow down*/}
      <path d="M7 6v12" />
      <path d="M4 14l3 4 3-4" />

      {/* Star in top right*/}
      <polygon
        points="17,2.5 19,5.5 22,5.5 19.5,8.5 20.3,11.5 17,10 13.7,11.5 14.5,8.5 12,5.5 15,5.5"
        fill="currentColor"
        stroke="none"
      />

      {/* Smaller star below*/}
      <polygon
        points="17,14 18.2,16.8 21,16.8 19,18.8 19.6,21.5 17,19.8 14.4,21.5 15,18.8 13,16.8 15.8,16.8"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
