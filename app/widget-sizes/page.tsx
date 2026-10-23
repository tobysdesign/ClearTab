"use client";

/*
 * Dev-only harness for widget responsiveness across size buckets.
 * Renders the REAL widgets (with demo sample data) inside fixed-size boxes so
 * tall / short / mini / narrow layouts can be eyeballed side by side.
 * Not linked anywhere; noindex. Reuses /demo's in-memory backend + auth.
 */

import { useEffect, useState } from "react";
import { AuthContext, type AuthContextType } from "@/components/auth/auth-context";
import { demoApi } from "@/lib/demo/backend";
import { demoAudio } from "@/lib/demo/audio";
import { enableDemoMode } from "@/lib/demo/mode";
import { sandboxDemo } from "@/lib/demo/sandbox";
import { DEMO_USER } from "@/lib/demo/data";
import { CountdownWidget } from "@/components/widgets/countdown-widget-main";
import { CountdownBreakdown } from "@/components/widgets/countdown-breakdown";
import { ScheduleWidget } from "@/components/widgets/schedule-widget";
import { TasksWidget } from "@/components/widgets/tasks-widget";
import { NotesWidget } from "@/components/widgets/notes-widget";
import { WeatherWidgetNew } from "@/components/widgets/weather-widget-new";
import { RecorderWidget } from "@/components/widgets/recorder-widget";

if (typeof window !== "undefined") {
  sandboxDemo();
  enableDemoMode({ api: demoApi, audio: demoAudio });
}

const DEMO_AUTH: AuthContextType = {
  user: DEMO_USER,
  session: { user: DEMO_USER, expires: "2099-01-01T00:00:00.000Z" },
  signIn: async () => {},
  signOut: async () => {},
  loading: false,
};

// [label, width, height] -- "1/8th" tall is ~170px (12.5% of a ~1360 viewport)
const SIZES: Array<[string, number, number]> = [
  ["tall-narrow (1/8)", 170, 520],
  ["tall-med", 280, 420],
  ["tall-med2", 340, 420],
  ["short-narrow", 170, 150],
  ["short-med", 260, 150],
  ["short-med2", 320, 150],
  ["mini", 320, 90],
  ["wide-short", 520, 150],
];

// The breakdown is the part that overflows at narrow width; render it directly
// with 3 units (months+weeks+days) to reproduce the real-data case.
function BreakdownBox() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 24px", color: "#d2d2d2", fontSize: 14 }}>
        Counter
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative", padding: "0 24px 24px", overflow: "hidden" }}>
        <CountdownBreakdown daysLeft={430} title="Toby" />
      </div>
    </div>
  );
}

const WIDGETS: Array<[string, () => React.ReactNode]> = [
  ["Counter (3-unit breakdown)", () => <BreakdownBox />],
  ["Counter", () => <CountdownWidget />],
  ["Schedule", () => <ScheduleWidget />],
  ["Tasks", () => <TasksWidget searchQuery="" />],
  ["Weather", () => <WeatherWidgetNew />],
  ["Recorder", () => <RecorderWidget />],
  ["Notes", () => <NotesWidget />],
];

function Box({ label, w, h, children }: { label: string; w: number; h: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
        {label} · {w}×{h}
      </span>
      <div
        style={{
          width: w,
          height: h,
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          background: "#0d0d0d",
          border: "1px solid #242424",
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function WidgetSizesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <AuthContext.Provider value={DEMO_AUTH}>
      {/* The app locks body scroll (globals.css body overflow:hidden), so this dev page scrolls internally. */}
      <div style={{ height: "100vh", overflowY: "auto", background: "#000", padding: 24, color: "#fff" }}>
        <h1 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Widget size buckets</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {WIDGETS.map(([name, render]) => (
            <section key={name} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h2 style={{ fontSize: 13, color: "#c4c4c4", fontWeight: 500 }}>{name}</h2>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                {SIZES.map(([label, w, h]) => (
                  <Box key={label} label={label} w={w} h={h}>
                    {render()}
                  </Box>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AuthContext.Provider>
  );
}
