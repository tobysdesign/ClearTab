"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, PanInfo, useAnimationControls } from "framer-motion";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { CharcoalWave } from "@/components/ui/charcoal-wave";
import { LoginBentoGrid } from "@/components/dashboard/login-bento-grid";
import { LoginDockContent } from "@/components/dashboard/login-dock-content";
import { PieGuide } from "@/components/dashboard/pie-guide";
import { DragIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import styles from "./page.module.css";

// Dock interfaces
interface DropZone {
  id: "top" | "left" | "right" | "bottom";
  x: number;
  y: number;
  width: number;
  height: number;
}

// Login Widget Component
function LoginWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      await signIn("google");
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginWidget}>
      <div className={styles.loginContent}>
        <h1 className={styles.loginTitle}>ClearTab</h1>
        <p className={styles.loginSubtitle}>
          A productivity dashboard for clarity at your fingertips, and{" "}
          <i>just for you.</i>
        </p>
        <p className={styles.loginSubtitle}>Sign up to get started!</p>

        <Button
          className={styles.googleButton}
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            className={styles.googleIcon}
          >
            <g fill="none" fillRule="evenodd">
              <path
                fill="#4285F4"
                d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </g>
          </svg>
          Sign up / in with Google
        </Button>

        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const [isDragging, setIsDragging] = useState(false);
  const [nearestZoneId, setNearestZoneId] = useState<
    "top" | "left" | "right" | "bottom" | null
  >(null);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [position, setPosition] = useState<"top" | "left" | "right" | "bottom">(
    "bottom",
  );
  const [dropZones, setDropZones] = useState<DropZone[]>([]);

  const initialPosition = "bottom" as DropZone["id"];

  // Calculate initial currentZoneState based on a default position
  const initialCurrentZoneState =
    typeof window !== "undefined"
      ? {
          id: initialPosition,
          x: (window.innerWidth - 150) / 2, // Center horizontally with correct width
          y: window.innerHeight - 52 - 10, // Bottom edge closer to border
          width: 150, // DOCK_WIDTH_HORIZONTAL
          height: 52, // DOCK_HEIGHT
        }
      : null;

  const [_currentZoneState, _setCurrentZoneState] = useState<DropZone | null>(
    initialCurrentZoneState,
  );

  // Sync isDragging state with body class
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add("dragging");
    } else {
      document.body.classList.remove("dragging");
    }
    return () => {
      document.body.classList.remove("dragging");
    };
  }, [isDragging]);

  const isVertical = position === "left" || position === "right";

  const calculateDropZones = useCallback(() => {
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

    // More realistic dock dimensions based on actual content
    const DOCK_WIDTH_HORIZONTAL = 150; // Horizontal dock width (icons + padding)
    const DOCK_HEIGHT = 52; // Standard dock height
    const DOCK_WIDTH_VERTICAL = 52; // Vertical dock width

    const newZones: DropZone[] = [
      {
        id: "top",
        x: (windowWidth - DOCK_WIDTH_HORIZONTAL) / 2, // Center horizontally
        y: 10, // Top edge closer to border
        width: DOCK_WIDTH_HORIZONTAL,
        height: DOCK_HEIGHT,
      },
      {
        id: "bottom",
        x: (windowWidth - DOCK_WIDTH_HORIZONTAL) / 2, // Center horizontally
        y: windowHeight - DOCK_HEIGHT - 10, // Bottom edge closer to border
        width: DOCK_WIDTH_HORIZONTAL,
        height: DOCK_HEIGHT,
      },
      {
        id: "left",
        x: 10, // Left edge closer to border
        y: (windowHeight - 150) / 2, // Center vertically
        width: DOCK_WIDTH_VERTICAL,
        height: 150,
      },
      {
        id: "right",
        x: windowWidth - DOCK_WIDTH_VERTICAL - 10, // Right edge closer to border
        y: (windowHeight - 150) / 2, // Center vertically
        width: DOCK_WIDTH_VERTICAL,
        height: 150,
      },
    ];

    setDropZones(newZones);
  }, []);

  const currentZone = dropZones.find((zone) => zone.id === position);

  useEffect(() => {
    calculateDropZones();
    window.addEventListener("resize", calculateDropZones);
    return () => window.removeEventListener("resize", calculateDropZones);
  }, [calculateDropZones]);

  useEffect(() => {
    if (currentZone) {
      controls.start(
        {
          x: currentZone.x,
          y: currentZone.y,
        },
        { type: "spring", stiffness: 500, damping: 40 },
      );
    }
  }, [currentZone, controls, position]);

  const handleDragStart = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo,
  ) => {
    setIsDragging(true);
    if (currentZone) {
      // Calculate the center of the dock for pie guide positioning
      setDragOrigin({
        x: currentZone.x + currentZone.width / 2,
        y: currentZone.y + currentZone.height / 2,
      });
    }
  };

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo,
  ) => {
    let closestZone: DropZone | null = null;
    let minDistance = Infinity;

    const validZones = dropZones.filter((z) => z.id !== position);

    for (const zone of validZones) {
      const zoneCenterX = zone.x;
      const zoneCenterY = zone.y;
      const distance = Math.sqrt(
        Math.pow(_info.point.x - zoneCenterX, 2) +
          Math.pow(_info.point.y - zoneCenterY, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    }

    if (closestZone && minDistance < 600) {
      setNearestZoneId(closestZone.id);
    } else {
      setNearestZoneId(null);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (nearestZoneId) {
      setPosition(nearestZoneId);
    } else if (currentZone) {
      // Snap back
      controls.start(
        {
          x: currentZone.x,
          y: currentZone.y,
          width: currentZone.width,
          height: currentZone.height,
        },
        { type: "spring", stiffness: 500, damping: 40 },
      );
    }
    setNearestZoneId(null);
    setDragOrigin(null);
  };

  if (!currentZone) {
    return (
      <div className={styles.container}>
        <CharcoalWave />
        <div className="dashboard-container">
          <div className="dashboard-content">
            <LoginBentoGrid
              dockPosition="bottom"
              searchQuery=""
              login={<LoginWidget />}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Background shader */}
      <CharcoalWave />

      <PieGuide
        isDragging={isDragging}
        hoveredSlice={nearestZoneId}
        position={dragOrigin}
        originPosition={position}
      />

      {/* Real dashboard with login overlay */}
      <div className="dashboard-container">
        <div className="dashboard-content">
          <LoginBentoGrid
            dockPosition={position}
            searchQuery=""
            login={<LoginWidget />}
          />
        </div>
      </div>

      {/* Drop zones during drag */}
      {isDragging &&
        dropZones.map((zone) => {
          if (zone.id === position) return null; // Don't show the origin zone
          return (
            <div
              key={zone.id}
              className={cn(
                "drop-zone",
                nearestZoneId === zone.id
                  ? "drop-zone-active"
                  : "drop-zone-inactive",
              )}
              style={{
                left: zone.x + zone.width / 2,
                top: zone.y + zone.height / 2,
                width:
                  zone.id === "left" || zone.id === "right" ? "52px" : "150px",
                height:
                  zone.id === "left" || zone.id === "right" ? "150px" : "50px",
              }}
            />
          );
        })}

      {/* Draggable Dock */}
      {typeof window !== "undefined" &&
        createPortal(
          <motion.div
            drag
            dragConstraints={{
              left: 0,
              right:
                typeof window !== "undefined" ? window.innerWidth - 100 : 1000,
              top: 0,
              bottom:
                typeof window !== "undefined" ? window.innerHeight - 100 : 1000,
            }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            dragMomentum={false}
            className="dock-container"
            animate={controls}
            initial={
              currentZone
                ? { x: currentZone.x, y: currentZone.y }
                : {
                    x:
                      typeof window !== "undefined"
                        ? (window.innerWidth - 200) / 2 + 29
                        : 500,
                    y:
                      typeof window !== "undefined"
                        ? window.innerHeight - 20 - 60 + 25
                        : 700,
                  }
            }
            style={{ position: "fixed", top: 0, left: 0, zIndex: 30 }}
          >
            <div
              className={cn(
                "dock-content",
                isVertical
                  ? "dock-content-vertical"
                  : "dock-content-horizontal",
              )}
            >
              <LoginDockContent isVertical={isVertical} />

              <div
                className="dock-handle"
                onPointerDown={(e) => {
                  const target = e.currentTarget as HTMLDivElement;
                  target.setPointerCapture(e.pointerId);
                }}
              >
                <DragIcon size={16} className="text-white/60" />
              </div>
            </div>
          </motion.div>,
          document.body,
        )}
    </div>
  );
}
