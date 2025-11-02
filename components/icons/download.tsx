"use client";

import * as React from "react";

interface DownloadIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function DownloadIcon({ size = 16, ...props }: DownloadIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 2v7.2m0 0 2.8-2.8M8 9.2 5.2 6.4M3 11.2v1.6c0 .44.36.8.8.8h8.4c.44 0 .8-.36.8-.8v-1.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
