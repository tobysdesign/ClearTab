"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, PanInfo, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { DragIcon } from "@/components/icons";
// Icons replaced with ASCII placeholders
import { DockContent } from "../dashboard/dock-content";
import { ResizableBentoGrid } from "./resizable-bento-grid";
import { PieGuide } from "./pie-guide";
import { type ReactNode } from "react";
import { BrandedLoader } from "@cleartab/ui";
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
      <BrandedLoader size="medium" />
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
    const _EDGE_MARGIN = 20;

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

    console.log("🔧 Calculating drop zones:", {
      windowWidth,
      windowHeight,
      newZones: newZones.map(zone => ({ id: zone.id, x: zone.x, y: zone.y }))
    });

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
      console.log("🚀 Positioning dock:", {
        position,
        currentZone: { id: currentZone.id, x: currentZone.x, y: currentZone.y }
      });

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
                left: zone.x + zone.width / 2,
                top: zone.y + zone.height / 2,
                width: zone.id === 'left' || zone.id === 'right' ? '52px' : '150px',
                height: zone.id === 'left' || zone.id === 'right' ? '150px' : '50px',
              }}
            />
          );
        })}

      {typeof window !== 'undefined' && createPortal(
        <motion.div
          drag
          dragConstraints={{
            left: 0,
            right: typeof window !== 'undefined' ? window.innerWidth - 100 : 1000,
            top: 0,
            bottom: typeof window !== 'undefined' ? window.innerHeight - 100 : 1000,
          }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          dragMomentum={false}
          className="dock-container"
          animate={controls}
          initial={currentZone ? { x: currentZone.x, y: currentZone.y } : { x: typeof window !== 'undefined' ? (window.innerWidth - 200) / 2 + 29 : 500, y: typeof window !== 'undefined' ? window.innerHeight - 20 - 60 + 25 : 700 }}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 30 }}
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
        document.body
      )}
    </div>
  );
}
