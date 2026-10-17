"use client";

import * as React from "react";
import { Button, Select, SelectItem, useToast } from "@cleartab/ui";
import sharedStyles from "./settings-shared.module.css";
import drawerStyles from "./settings-drawer.module.css";
import styles from "./transcription-settings.module.css";
import {
  getTranscriptionConfig,
  setTranscriptionConfig,
  isValidGeminiKey,
  type TranscriptionEngine,
} from "@/lib/transcription-config";

interface TranscriptionSettingsProps {
  sectionId: string;
  heading: string;
  description?: string;
}

const ENGINE_CAPTIONS: Record<TranscriptionEngine, string> = {
  gemini:
    "Use your own Google Gemini API key. Your recordings are sent to Google and transcribed on your quota.",
  "local-en":
    "Transcribes on this device. Smaller download, English only. Audio never leaves your computer.",
  "local-multi":
    "Transcribes on this device in many languages. Larger download. Audio never leaves your computer.",
};

export const TranscriptionSettings = React.forwardRef<
  HTMLElement,
  TranscriptionSettingsProps
>(function TranscriptionSettings({ sectionId, heading, description }, ref) {
  const { toast } = useToast();
  const [engine, setEngine] = React.useState<TranscriptionEngine>("local-en");
  const [geminiKey, setGeminiKey] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [cachedLabel, setCachedLabel] = React.useState<string | null>(null);

  const refreshCached = React.useCallback(async () => {
    try {
      const { isModelCached } = await import("@/lib/transcription/local");
      const [en, multi] = await Promise.all([
        isModelCached("local-en"),
        isModelCached("local-multi"),
      ]);
      const parts: string[] = [];
      if (en) parts.push("English");
      if (multi) parts.push("Multilingual");
      setCachedLabel(
        parts.length ? `${parts.join(" and ")} model downloaded` : null,
      );
    } catch {
      setCachedLabel(null);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    getTranscriptionConfig()
      .then((cfg) => {
        if (!active) return;
        setEngine(cfg.engine ?? "local-en");
        setGeminiKey(cfg.geminiKey ?? "");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    void refreshCached();
    return () => {
      active = false;
    };
  }, [refreshCached]);

  const handleSave = async () => {
    if (engine === "gemini" && !isValidGeminiKey(geminiKey)) {
      toast({
        title: "Add your API key",
        description: "Enter a valid Google Gemini API key to use Gemini.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await setTranscriptionConfig({ engine, geminiKey });
      toast({
        title: "Transcription updated",
        description:
          engine === "gemini"
            ? "Using your own Gemini API key."
            : "Transcribing on this device.",
      });
    } catch {
      toast({
        title: "Couldn't save",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      const { clearModelCache } = await import("@/lib/transcription/local");
      await clearModelCache();
      toast({ title: "On-device model cleared" });
      await refreshCached();
    } catch {
      toast({
        title: "Couldn't clear model",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <section ref={ref} className={sharedStyles.card} data-section-id={sectionId}>
      <div className={drawerStyles.sectionHeading}>
        <h2 className={drawerStyles.sectionTitle}>{heading}</h2>
        {description ? (
          <p className={drawerStyles.sectionDescription}>{description}</p>
        ) : null}
      </div>

      <div className={`${sharedStyles.innerCard} ${styles.form}`}>
        <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
          <span className={sharedStyles.label}>Transcription engine</span>
          <Select
            id="transcription-engine"
            value={engine}
            onValueChange={(val) => setEngine(val as TranscriptionEngine)}
            className={sharedStyles.selectAuto}
            disabled={loading}
          >
            <SelectItem value="local-en">On device — English only</SelectItem>
            <SelectItem value="local-multi">On device — Multilingual</SelectItem>
            <SelectItem value="gemini">Gemini (cloud)</SelectItem>
          </Select>
          <p className={styles.caption}>{ENGINE_CAPTIONS[engine]}</p>
        </div>

        {engine === "gemini" ? (
          <div className={`${sharedStyles.field} ${sharedStyles.fieldGrow}`}>
            <span className={sharedStyles.label}>Gemini API key</span>
            <input
              type="password"
              value={geminiKey}
              onChange={(event) => setGeminiKey(event.target.value)}
              placeholder="AIza…"
              autoComplete="off"
              spellCheck={false}
              className={sharedStyles.input}
              disabled={loading || saving}
            />
            <p className={styles.securityNote}>
              Stored only on this device and sent to Google over HTTPS as a request
              header — never in a URL, and never saved on ClearTab's servers. Get a free
              key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Google AI Studio
              </a>
              .
            </p>
          </div>
        ) : null}

        <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
          <span className={sharedStyles.label}>Downloaded model</span>
          <div>
            <Button
              className={`${sharedStyles.button} ${sharedStyles.buttonPill} ${sharedStyles.buttonSubtle}`}
              onClick={handleClear}
              disabled={loading || clearing}
              tooltipLabel="Delete the downloaded on-device model"
            >
              {clearing ? "Clearing…" : "Clear downloaded model"}
            </Button>
          </div>
          {cachedLabel ? <p className={styles.caption}>{cachedLabel}</p> : null}
        </div>

        <div className={sharedStyles.formActions}>
          <Button
            className={`${sharedStyles.button} ${sharedStyles.buttonPill}`}
            onClick={handleSave}
            disabled={loading || saving}
            tooltipLabel="Save transcription settings"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </section>
  );
});

TranscriptionSettings.displayName = "TranscriptionSettings";
