import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

export const PlayIcon = ({ size = 24, ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path d="M8 5v14l11-7z" />
    </svg>
);
