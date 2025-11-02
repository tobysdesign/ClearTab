"use client";

import * as React from "react";
import Image from "next/image";
import { CloseIcon } from "@/components/icons";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { DisplaySettings } from "./display-settings";
import { CountdownWidgetSettings } from "./countdown-widget-settings";
import { NotesVoiceTasksSettings } from "./notes-voice-tasks-settings";
import { WeatherSettings } from "./weather-settings";
import { AccountSettings } from "./account-settings";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import styles from "./settings-drawer.module.css";

type SectionId = "schedule" | "layout" | "data" | "weather" | "countdown";

interface SectionProps {
  sectionId: SectionId;
  heading: string;
  description?: string;
}

type SectionComponent = React.ForwardRefExoticComponent<
  SectionProps & React.RefAttributes<HTMLElement>
>;

interface SectionConfig {
  id: SectionId;
  label: string;
  description: string;
  component: SectionComponent;
}

const sections: SectionConfig[] = [
  {
    id: "schedule",
    label: "Schedule",
    component: AccountSettings,
  },
  {
    id: "layout",
    label: "Layout Preferences",
    component: DisplaySettings,
  },
  {
    id: "data",
    label: "Your Data",
    component: NotesVoiceTasksSettings,
  },
  {
    id: "weather",
    label: "Weather",
    component: WeatherSettings,
  },
  {
    id: "countdown",
    label: "Countdown",
    component: CountdownWidgetSettings,
  },
];

const legacyTabMap: Record<string, SectionId> = {
  "Display options": "layout",
  "Notes, Tasks & Voice": "data",
  "Countdown Widget": "countdown",
  Weather: "weather",
  Account: "schedule",
  Schedule: "schedule",
  "Layout Prefs.": "layout",
  "Your Data": "data",
  Countdown: "countdown",
  layout: "layout",
  schedule: "schedule",
  data: "data",
  weather: "weather",
  countdown: "countdown",
};

interface SettingsDrawerProps {
  initialTab?: string;
}

export function SettingsDrawer({
  initialTab = "schedule",
}: SettingsDrawerProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeSection, setActiveSection] =
    React.useState<SectionId>("schedule");
  const contentScrollRef = React.useRef<HTMLDivElement>(null);
  const programmaticScrollRef = React.useRef(false);
  const sectionRefs = React.useMemo(() => {
    return sections.reduce<Record<SectionId, React.RefObject<HTMLElement>>>(
      (acc, section) => {
        acc[section.id] = React.createRef<HTMLElement>();
        return acc;
      },
      {} as Record<SectionId, React.RefObject<HTMLElement>>,
    );
  }, []);

  const scrollToSection = React.useCallback(
    (sectionId: SectionId, behavior: ScrollBehavior = "smooth") => {
      const targetRef = sectionRefs[sectionId]?.current;
      const scrollContainer = contentScrollRef.current;
      if (!targetRef || !scrollContainer) {
        return;
      }

      const paddingTop =
        typeof window !== "undefined"
          ? parseFloat(window.getComputedStyle(scrollContainer).paddingTop || "0")
          : 0;
      const visualOffset = 52;
      const targetTop = Math.max(targetRef.offsetTop - paddingTop - visualOffset, 0);

      programmaticScrollRef.current = true;
      scrollContainer.scrollTo({ top: targetTop, behavior });
      window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, behavior === "auto" ? 80 : 220);
    },
    [sectionRefs],
  );

  const mapToSection = React.useCallback((tab?: string): SectionId => {
    if (tab) {
      const mapped = legacyTabMap[tab];
      if (mapped) {
        return mapped;
      }
    }
    return "schedule";
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const scrollContainer = contentScrollRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "auto" });
    }
    const targetSection = initialTab ? mapToSection(initialTab) : "schedule";
    setActiveSection(targetSection);
    programmaticScrollRef.current = true;
    scrollToSection(targetSection, "auto");
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 200);
  }, [initialTab, isOpen, mapToSection, scrollToSection]);

  // Listen for global events requesting settings drawer
  React.useEffect(() => {
    const handleOpenSettings = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: string }>;
      const targetSection = customEvent.detail?.tab
        ? mapToSection(customEvent.detail.tab)
        : "schedule";
      setActiveSection(targetSection);
      setIsOpen(true);
      requestAnimationFrame(() => {
        scrollToSection(targetSection, "auto");
      });
    };

    window.addEventListener(
      "openSettings",
      handleOpenSettings as EventListener,
    );
    return () =>
      window.removeEventListener(
        "openSettings",
        handleOpenSettings as EventListener,
      );
  }, [mapToSection, scrollToSection]);

  React.useEffect(() => {
    const scrollEl = contentScrollRef.current;
    if (!isOpen || !scrollEl) return;

    const updateActiveFromScroll = () => {
      if (programmaticScrollRef.current) return;
      const scrollPosition = scrollEl.scrollTop + 120;
      let closestSection: SectionId = activeSection;
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const element = sectionRefs[section.id]?.current;
        if (!element) continue;
        const distance = Math.abs(element.offsetTop - scrollPosition);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestSection = section.id;
        }
      }

      if (closestSection !== activeSection) {
        setActiveSection(closestSection);
      }
    };

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActiveFromScroll();
        ticking = false;
      });
    };

    // Initialize highlight once drawer content is mounted
    updateActiveFromScroll();
    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [activeSection, sectionRefs, isOpen]);

  const handleNavClick = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    scrollToSection(sectionId, "smooth");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to sign out from settings drawer:", error);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={setIsOpen}
      shouldScaleBackground={false}
      modal
    >
      <DrawerContent
        overlayVariant="settings"
        className={styles.drawerContent}
        showHandle={false}
      >
        <VisuallyHidden>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>
            Application settings and preferences
          </DrawerDescription>
        </VisuallyHidden>

        <div className={styles.container}>
          <aside className={styles.sidebar}>
            <nav className={styles.nav}>
              <ul className={styles.navList}>
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(section.id)}
                      className={cn(
                        styles.navButton,
                        activeSection === section.id && styles.navButtonActive,
                      )}
                    >
                      <span className={styles.navButtonTitle}>
                        {section.label}
                      </span>
                      <span className={styles.navButtonDescription}>
                        {section.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.sidebarFooter}>
              <div className={styles.profile}>
                <div className={styles.avatar}>
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt={
                        user.user_metadata.full_name ??
                        user.email ??
                        "User avatar"
                      }
                      fill
                      sizes="48px"
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarFallback}>
                      {(user?.email || "User").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.profileMeta}>
                  <span className={styles.profileName}>
                    {authLoading
                      ? "Loading…"
                      : user?.user_metadata?.full_name ||
                        user?.email ||
                        "Guest"}
                  </span>
                  <span className={styles.profileEmail}>
                    {authLoading ? "" : (user?.email ?? "")}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Log out
              </Button>
            </div>
          </aside>

          <main className={styles.content}>
            <header className={styles.header}>
              <h1 className={styles.title}>Settings</h1>
              <Button
                variant="ghost-icon"
                size="icon"
                onClick={() => setIsOpen(false)}
                className={styles.closeButton}
              >
                <span className="sr-only">Close</span>
                <CloseIcon size={16} className={styles.closeIcon} />
              </Button>
            </header>

            <div ref={contentScrollRef} className={styles.sections}>
              {sections.map(
                ({ id, label, description, component: SectionComponent }) => (
                  <SectionComponent
                    key={id}
                    ref={sectionRefs[id]}
                    sectionId={id}
                    heading={label}
                    description={description}
                  />
                ),
              )}
            </div>
          </main>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
