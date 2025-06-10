// Emotional face components for replacing generic icons with expressive faces
import smileIcon from "@/assets/faces/smile.svg";
import sadIcon from "@/assets/faces/sad.svg";
import bigeyeIcon from "@/assets/faces/bigeye.svg";
import sidewaysIcon from "@/assets/faces/sideways.svg";
import downtriddenIcon from "@/assets/faces/downtridden.svg";
import upconfusedIcon from "@/assets/faces/upconfused.svg";

interface FaceIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6", 
  lg: "w-8 h-8"
};

export function SmileFace({ className = "", size = "md" }: FaceIconProps) {
  return <img src={smileIcon} alt="smile" className={`${sizeClasses[size]} ${className}`} />;
}

export function SadFace({ className = "", size = "md" }: FaceIconProps) {
  return <img src={sadIcon} alt="sad" className={`${sizeClasses[size]} ${className}`} />;
}

export function BigEyeFace({ className = "", size = "md" }: FaceIconProps) {
  return <img src={bigeyeIcon} alt="surprised" className={`${sizeClasses[size]} ${className}`} />;
}

export function SidewaysFace({ className = "", size = "md" }: FaceIconProps) {
  return <img src={sidewaysIcon} alt="confused" className={`${sizeClasses[size]} ${className}`} />;
}

export function DowntriddenFace({ className = "", size = "md" }: FaceIconProps) {
  return <img src={downtriddenIcon} alt="downtridden" className={`${sizeClasses[size]} ${className}`} />;
}

export function UpconfusedFace({ className = "", size = "md" }: FaceIconProps) {
  return <img src={upconfusedIcon} alt="upconfused" className={`${sizeClasses[size]} ${className}`} />;
}

// Emotion mapping for different contexts
export const EmotionalFaces = {
  happy: SmileFace,
  sad: SadFace,
  surprised: BigEyeFace,
  confused: SidewaysFace,
  tired: DowntriddenFace,
  thinking: UpconfusedFace
};