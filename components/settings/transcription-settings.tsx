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
  isValidProxyUrl,
  type TranscriptionMode,
} from "@/lib/transcription-config";
import { requestHostPermission } from "@/lib/chrome-extension-utils";

interface TranscriptionSettingsProps {
  sectionId: string;
  heading: string;
  description?: string;
}

const MODE_CAPTIONS: Record<TranscriptionMode, string> = {
  builtin:
    "ClearTab transcribes your voice memos for you. Nothing to set up.",
  byok:
    "Use your own Google Gemini API key. Your recordings are transcribed on your quota, not ClearTab's.",
  proxy:
    "Send recordings to your own transcription server (a self-hosted ClearTab or compatible endpoint). Your key stays on that server.",
};

export const TranscriptionSettings = React.forwardRef<
  HTMLElement,
  TranscriptionSettingsProps
>(function TranscriptionSettings({ sectionId, heading, description }, ref) {
  const { toast } = useToast();
  const [mode, setMode] = React.useState<TranscriptionMode>("builtin");
  const [geminiKey, setGeminiKey] = React.useState("");
  const [proxyUrl, setProxyUrl] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    getTranscriptionConfig()
      .then((cfg) => {
        if (!active) return;
        setMode(cfg.mode);
        setGeminiKey(cfg.geminiKey ?? "");
        setProxyUrl(cfg.proxyUrl ?? "");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (mode === "byok" && !isValidGeminiKey(geminiKey)) {
      toast({
        title: "Add your API key",
        description: "Enter a valid Google Gemini API key to use your own key.",
        variant: "destructive",
      });
      return;
    }
    if (mode === "proxy" && !isValidProxyUrl(proxyUrl)) {
      toast({
        title: "Add a backend URL",
        description: "Enter a valid https:// transcription endpoint.",
        variant: "destructive",
      });
      return;
    }

    // In the extension, calling an arbitrary backend needs that origin's host permission.
    // Request it now, inside the click gesture, before any other await. (No-op on the web.)
    if (mode === "proxy") {
      const granted = await requestHostPermission(proxyUrl);
      if (!granted) {
        toast({
          title: "Permission needed",
          description:
            "ClearTab needs your allowance to send recordings to that site. Save again and choose Allow.",
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      await setTranscriptionConfig({ mode, geminiKey, proxyUrl });
      toast({
        title: "Transcription updated",
        description:
          mode === "builtin"
            ? "Using ClearTab's built-in transcription."
            : mode === "byok"
              ? "Using your own Gemini API key."
              : "Sending recordings to your backend.",
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
          <span className={sharedStyles.label}>Transcription source</span>
          <Select
            id="transcription-mode"
            value={mode}
            onValueChange={(val) => setMode(val as TranscriptionMode)}
            className={sharedStyles.selectAuto}
            disabled={loading}
          >
            <SelectItem value="builtin">Built-in (ClearTab)</SelectItem>
            <SelectItem value="byok">Your own API key</SelectItem>
            <SelectItem value="proxy">Your own backend</SelectItem>
          </Select>
          <p className={styles.caption}>{MODE_CAPTIONS[mode]}</p>
        </div>

        {mode === "byok" ? (
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
              key from Google AI Studio.
            </p>
          </div>
        ) : null}

        {mode === "proxy" ? (
          <div className={`${sharedStyles.field} ${sharedStyles.fieldGrow}`}>
            <span className={sharedStyles.label}>Backend URL</span>
            <input
              type="url"
              value={proxyUrl}
              onChange={(event) => setProxyUrl(event.target.value)}
              placeholder="https://your-server.example.com/api/transcribe"
              autoComplete="off"
              spellCheck={false}
              className={sharedStyles.input}
              disabled={loading || saving}
            />
            <p className={styles.securityNote}>
              Recordings POST straight to this endpoint, which must accept the same
              multipart form as ClearTab&apos;s. In the Chrome extension, the browser may
              prompt to allow this site the first time.
            </p>
          </div>
        ) : null}

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
