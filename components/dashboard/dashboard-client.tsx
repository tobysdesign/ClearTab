"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { motion, PanInfo, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";
// Icons replaced with ASCII placeholders
import { DockContent } from "../dashboard/dock-content";
import { ResizableBentoGrid } from "./resizable-bento-grid";
import { SettingsDrawer } from "@/components/settings/settings-drawer";
import { PieGuide } from "./pie-guide";
import { type ReactNode } from "react";
import Image from "next/image";
import styles from "./dashboard-client.module.css";

interface DashboardClientProps {
  notes: ReactNode;
  tasks: ReactNode;
}

interface DropZone {
  id: "top" | "left" | "right" | "bottom";
  x: number;
  y: number;
  width: number;
  height: number;
}

function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingImageContainer}>
        <Image
          src="/assets/loading.gif"
          alt="Loader..."
          fill
          className="object-contain"
          priority
          unoptimized={true}
        />
      </div>
    </div>
  );
}

export function DashboardClient({ notes, tasks }: DashboardClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
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
          x: window.innerWidth / 2,
          y: window.innerHeight - 60,
          width: 0,
          height: 0,
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
    const _EDGE_MARGIN = 8;

    const newZones: DropZone[] = [
      {
        id: "top",
        x: windowWidth / 2,
        y: 60,
        width: 0,
        height: 0,
      },
      {
        id: "bottom",
        x: windowWidth / 2,
        y: windowHeight - 60,
        width: 0,
        height: 0,
      },
      {
        id: "left",
        x: _EDGE_MARGIN + 60,
        y: windowHeight / 2,
        width: 0,
        height: 0,
      },
      {
        id: "right",
        x: windowWidth - _EDGE_MARGIN - 60,
        y: windowHeight / 2,
        width: 0,
        height: 0,
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
  }, [currentZone, controls]);

  const handleDragStart = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo,
  ) => {
    setIsDragging(true);
    if (currentZone) {
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
      const zoneCenterX = zone.x + zone.width / 2;
      const zoneCenterY = zone.y + zone.height / 2;
      const distance = Math.sqrt(
        Math.pow(info.point.x - zoneCenterX, 2) +
          Math.pow(info.point.y - zoneCenterY, 2),
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
    return <LoadingState />;
  }

  return (
    <div ref={containerRef} className="dashboard-container">
      {/* <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
      /> */}
      <PieGuide
        isDragging={isDragging}
        hoveredSlice={nearestZoneId}
        position={dragOrigin}
        originPosition={position}
      />

      <div className="dashboard-content">
        <Suspense fallback={<LoadingState />}>
          <ResizableBentoGrid
            notes={notes}
            tasks={tasks}
            searchQuery={searchQuery}
            dockPosition={position}
          />
        </Suspense>
      </div>

      {/* <DockContent
        isVertical={isVertical}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      /> */}

      {isDragging &&
        dropZones.map((zone) => {
          if (zone.id === position) return null; // Don't show the origin zone
          return (
            <div
              key={zone.id}
              className={cn(
                "drop-zone",
                nearestZoneId === zone.id ? "drop-zone-active" : "drop-zone-inactive",
              )}
              style={{
                left: zone.x,
                top: zone.y,
              }}
            />
          );
        })}

      <motion.div
        drag
        dragConstraints={containerRef}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
        className="dock-container"
        animate={controls}
      >
        <div
          className={cn(
            "dock-content",
            isVertical ? "dock-content-vertical" : "dock-content-horizontal",
          )}
        >
          <DockContent
            showSearch={showSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            setShowSearch={setShowSearch}
            isVertical={isVertical}
          />

          <SettingsDrawer />

          <div
            className="dock-handle"
            onPointerDown={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              target.setPointerCapture(e.pointerId);
            }}
          >
            <span className="dock-handle-icon">≡</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
