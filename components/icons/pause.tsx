import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

export const PauseIcon = ({ size = 24, ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);
