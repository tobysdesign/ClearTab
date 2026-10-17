"use client";

// Icons replaced with ASCII placeholders
import { useState, useEffect, memo, useMemo, useCallback, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, PauseIcon, TrashIcon, MicIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import styles from "./recorder-widget.module.css";
import {
  Button,
  WidgetHeader,
  BrandedLoader,
  WidgetContainer,
  ClientOnly,
  SimpleDropdown,
  SimpleDropdownItem,
} from "@cleartab/ui";
import { useToast } from "@cleartab/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { isExtensionEnvironment } from "@/lib/extension-utils";
import { apiFetch } from "@/lib/api-fetch";
import { stringToQuillDelta } from "@/lib/quill-utils";
import { useWidgetHeight } from "@/hooks/use-widget-height";
import { getDemoApi } from "@/lib/demo/mode";
import {
  getTranscriptionConfig,
  setTranscriptionConfig,
  isValidGeminiKey,
  type TranscriptionEngine,
} from "@/lib/transcription-config";
import { TranscriptionChoice } from "./transcription-choice";

// Waveform frames kept while recording (10fps); also the mini bar count
const MAX_WAVEFORM_FRAMES = 160;

interface RecorderWidgetProps {
  className?: string;
}

interface RecordingControlsProps {
  state: string;
  isMuted: boolean;
  showSuccess: boolean;
  confirmingDelete: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onResume: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onTranscribe: () => void;
  onViewNote?: () => void;
  onRecordNew?: () => void;
}

const RecordingControls = memo(function RecordingControls({
  state,
  isMuted,
  showSuccess,
  confirmingDelete,
  onToggleMute,
  onPause,
  onResume,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onTranscribe,
  onViewNote,
  onRecordNew,
}: RecordingControlsProps) {
  if (state === "recording" || state === "paused") {
    if (confirmingDelete) {
      return (
        <DeleteConfirm onCancel={onCancelDelete} onConfirm={onConfirmDelete} />
      );
    }

    return (
      <>
        <Button
          size="icon"
          onClick={onToggleMute}
          tooltipLabel={isMuted ? "Unmute" : "Mute"}
        >
          <img
            src={
              isMuted ? "/icons/si_micMute-fill.svg" : "/icons/si_mic-fill.svg"
            }
            alt=""
            className={styles.controlIcon}
          />
        </Button>

        <PauseResumeButton state={state} onPause={onPause} onResume={onResume} />

        <DeleteButton onClick={onRequestDelete} />

        <TranscribeButton onClick={onTranscribe} />
      </>
    );
  }

  if (showSuccess) {
    return (
      <div className={styles.transcriptionCompleteContainer}>
        <div className={styles.transcriptionCompleteMessage}>
          <CheckIcon size={16} className={styles.successCheckIcon} />
          <span>Saved to Notes</span>
        </div>
        <div className={styles.successActionButtons}>
          {onRecordNew && (
            <Button size="sm" onClick={onRecordNew}>
              Record new
            </Button>
          )}
          {onViewNote && (
            <Button size="sm" variant="ghost" onClick={onViewNote}>
              View note
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
});

// Shared by the mini and expanded layouts so paused/recording look identical.
function PauseResumeButton({
  state,
  onPause,
  onResume,
}: {
  state: string;
  onPause: () => void;
  onResume: () => void;
}) {
  if (state === "paused") {
    return (
      <Button size="icon" onClick={onResume} tooltipLabel="Resume recording">
        <span className={styles.resumeDot} />
      </Button>
    );
  }
  return (
    <Button size="icon" onClick={onPause} tooltipLabel="Pause">
      <PauseIcon size={14} />
    </Button>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="icon"
      variant="destructive"
      onClick={onClick}
      tooltipLabel="Delete recording"
    >
      <TrashIcon size={16} />
    </Button>
  );
}

function TranscribeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="icon"
      variant="success"
      onClick={onClick}
      tooltipLabel="Stop recording and transcribe to notes"
    >
      <CheckIcon size={16} />
    </Button>
  );
}

function DeleteConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={styles.deleteConfirm}>
      <span className={styles.deleteConfirmText}>Delete recording?</span>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button size="sm" variant="destructive" onClick={onConfirm}>
        Delete
      </Button>
    </div>
  );
}

export function RecorderWidget({ className }: RecorderWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const miniStartLabelId = useId();
  const [createdNoteId, setCreatedNoteId] = useState<string | null>(null);
  const [waveformHistory, setWaveformHistory] = useState<Uint8Array[]>([]);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  // Use auth
  const { user } = useAuth();

  const activeVoiceNoteIdRef = useRef<string | null>(null);

  // Transcription engine choice: pendingBlob = a recording is waiting on the
  // first-run choice; choiceOpen = the choice card is showing.
  const [pendingBlob, setPendingBlob] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  // Engine of the run currently in flight (null when nothing is transcribing)
  const [runningEngine, setRunningEngine] = useState<TranscriptionEngine | null>(null);
  const [savedEngine, setSavedEngine] = useState<TranscriptionEngine | undefined>(undefined);
  const [hasKey, setHasKey] = useState(false);

  const {
    state,
    duration,
    audioBlob,
    isMuted,
    audioData,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    toggleMute,
    transcribeAudio,
    localProgress,
    saveAudioLocally,
    reset,
    discardRecording,
  } = useAudioRecorder({
    onTranscriptionComplete: async (text: string) => {
      const targetId = activeVoiceNoteIdRef.current;
      console.log("Transcription complete for note:", targetId, text);
      if (!targetId) return;

      try {
        const deltaContent = stringToQuillDelta(text);
        await apiFetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            noteId: targetId,
            title: "Voice Note",
            content: deltaContent,
          }),
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("note-transcribed", {
              detail: {
                id: targetId,
                text,
                content: deltaContent,
              },
            }),
          );
        }
      } catch (error) {
        console.error("Error updating note with transcription:", error);
      }
    },
    onError: async (errorMsg: string) => {
      const targetId = activeVoiceNoteIdRef.current;
      console.error("Transcription error for note:", targetId, errorMsg);

      if (targetId) {
        const isCreditIssue =
          errorMsg.toLowerCase().includes("credit") ||
          errorMsg.toLowerCase().includes("quota") ||
          errorMsg.toLowerCase().includes("limit");
        const failedStatus = isCreditIssue ? "out_of_credits" : "transcription_failed";

        try {
          await apiFetch("/api/notes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              noteId: targetId,
              title: "Voice Note",
              content: {
                status: failedStatus,
                error: errorMsg,
                ops: [{ insert: "\n" }],
              },
            }),
          });

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("note-transcription-failed", {
                detail: {
                  id: targetId,
                  reason: failedStatus,
                  error: errorMsg,
                },
              }),
            );
          }
        } catch (updateErr) {
          console.error("Failed to update note with error status:", updateErr);
        }
      }

      toast({
        title: "Transcription failed",
        description: "Your voice memo was saved, but it couldn't be transcribed.",
        variant: "destructive",
      });
    },
  });

  const handleViewNote = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (createdNoteId && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("select-note", { detail: { id: createdNoteId } })
      );
    }
    setShowSuccess(false);
    setIsFlipped(false);
    setCreatedNoteId(null);
  }, [createdNoteId]);

  const handleRecordNew = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setShowSuccess(false);
    setIsFlipped(false);
    reset();
    setCreatedNoteId(null);
  }, [reset]);

  // When recording stops and audio is ready, immediately create note and switch to notes widget.
  // Transcription then proceeds in the background with progress displayed in the note itself.
  const transcribedBlobRef = useRef<Blob | null>(null);

  // Show "saved" on the recorder right away (not blocking further recordings),
  // then run transcription in the background with the chosen engine.
  const startWithEngine = useCallback(
    (engine: TranscriptionEngine) => {
      setRunningEngine(engine);
      setSavedEngine(engine);
      setChoiceOpen(false);
      setPendingBlob(false);

      setShowSuccess(true);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
        setIsFlipped(false);
        reset();
        setCreatedNoteId(null);
      }, 2000);

      Promise.resolve(transcribeAudio(engine)).finally(() => setRunningEngine(null));
    },
    [transcribeAudio, reset],
  );

  // Create the voice note (as "transcribing") and move focus to it. Called only
  // once an engine is known — never while the first-run choice card is open, so
  // notes don't show a transcribing spinner before a model is picked.
  const createVoiceNote = useCallback(async (engine: TranscriptionEngine): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save voice memos",
        variant: "destructive",
      });
      reset();
      return null;
    }
    try {
      const response = await apiFetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Voice Note",
          content: { status: "transcribing", engine, ops: [{ insert: "\n" }] },
        }),
      });
      const result: { success?: boolean; data?: { id?: string }; error?: string } =
        await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.data?.id) {
        console.error("Error creating voice note:", result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to save voice note",
          variant: "destructive",
        });
        reset();
        return null;
      }
      const noteId = result.data.id;
      activeVoiceNoteIdRef.current = noteId;
      setCreatedNoteId(noteId);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("note-created", { detail: { ...result, source: "voice" } }),
        );
        window.dispatchEvent(
          new CustomEvent("select-note", { detail: { id: noteId, note: result.data } }),
        );
      }
      return noteId;
    } catch (error) {
      console.error("Error creating voice note:", error);
      reset();
      return null;
    }
  }, [user, toast, reset]);

  const handleChoose = useCallback(
    async (engine: TranscriptionEngine, geminiKey?: string) => {
      let prevKey: string | undefined;
      try {
        prevKey = (await getTranscriptionConfig()).geminiKey;
      } catch {
        prevKey = undefined;
      }
      const key = geminiKey ?? prevKey;
      try {
        await setTranscriptionConfig({ engine, geminiKey: key });
      } catch (saveError) {
        console.error("Failed to save transcription config:", saveError);
        toast({
          title: "Error",
          description: "Couldn't save your transcription choice. Please try again.",
          variant: "destructive",
        });
        return; // keep the card open
      }
      setHasKey(isValidGeminiKey(key));
      if (pendingBlob) {
        // Now that a model is chosen, create the note (as transcribing) and run.
        const noteId = await createVoiceNote(engine);
        if (noteId) {
          startWithEngine(engine);
        } else {
          setPendingBlob(false);
          setChoiceOpen(false);
        }
      } else {
        // Just changing the default for future recordings; never touches an in-flight run
        setSavedEngine(engine);
        setChoiceOpen(false);
      }
    },
    [pendingBlob, startWithEngine, createVoiceNote, toast],
  );

  // Load the remembered engine so the label is visible before the first save
  useEffect(() => {
    let cancelled = false;
    getTranscriptionConfig()
      .then((cfg) => {
        if (cancelled) return;
        setSavedEngine(cfg.engine);
        setHasKey(isValidGeminiKey(cfg.geminiKey));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const downloadingModel = localProgress?.stage === "download";
  const downloadText =
    localProgress?.stage === "download"
      ? `Downloading model (one time)… ${Math.round(localProgress.ratio * 100)}%`
      : null;
  // One status line every layout can render while a model downloads
  const downloadLine = downloadText ? (
    <p className={styles.engineLabel} data-testid="model-download">{downloadText}</p>
  ) : null;
  // The engine label moved to the in-progress note card; the recorder only shows
  // the one-time model-download progress now.

  // Dismiss the first-run choice without transcribing: drop the recording. The note
  // isn't created until a model is chosen, so there's usually nothing to delete; the
  // guarded DELETE stays as a safety net.
  const handleDiscardPending = useCallback(() => {
    const noteId = activeVoiceNoteIdRef.current;
    activeVoiceNoteIdRef.current = null;
    setPendingBlob(false);
    setChoiceOpen(false);
    setCreatedNoteId(null);
    setIsFlipped(false);
    reset();
    if (noteId) {
      apiFetch(`/api/notes?id=${encodeURIComponent(noteId)}`, { method: "DELETE" }).catch(
        (err) => console.error("Failed to remove placeholder note:", err),
      );
    }
  }, [reset]);

  const choiceCard = (
    <div className={styles.choiceHost}>
      <TranscriptionChoice
        hasKey={hasKey}
        savedEngine={savedEngine}
        onChoose={handleChoose}
        onCancel={pendingBlob ? handleDiscardPending : () => setChoiceOpen(false)}
      />
    </div>
  );
  useEffect(() => {
    if (state === "processing" && audioBlob && audioBlob !== transcribedBlobRef.current) {
      transcribedBlobRef.current = audioBlob;
      console.log("Audio blob ready, immediately moving note to Notes widget...");

      const createAndMoveToNotes = async () => {
        // Resolve the engine FIRST, so the note is only created (as "transcribing")
        // once we know we're transcribing — never while the first-run choice is open.
        let cfg: Awaited<ReturnType<typeof getTranscriptionConfig>> = {};
        try {
          cfg = await getTranscriptionConfig();
        } catch (cfgError) {
          console.error("Could not read transcription config:", cfgError);
        }
        setSavedEngine(cfg.engine);
        setHasKey(isValidGeminiKey(cfg.geminiKey));

        if (!cfg.engine) {
          // First recording: hold the blob and ask; create nothing until they choose.
          setPendingBlob(true);
          setChoiceOpen(true);
          return;
        }

        const noteId = await createVoiceNote(cfg.engine);
        if (noteId) startWithEngine(cfg.engine);
      };

      createAndMoveToNotes();
    }
  }, [state, audioBlob, createVoiceNote, startWithEngine]);

  // Update waveform history for scrolling effect
  useEffect(() => {
    if (state === "recording" && audioData) {
      setWaveformHistory((prev) => {
        const newHistory = [...prev, audioData];
        // Keep enough frames to fill a full-width mini waveform (~16s at 10fps)
        return newHistory.slice(-MAX_WAVEFORM_FRAMES);
      });
    } else if (state === "idle") {
      setWaveformHistory([]);
    }
  }, [audioData, state]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    setIsFlipped(true);
    setTimeout(async () => {
      await startRecording();
    }, 400);
  };

  const handleStopRecording = async () => {
    console.log("Stop recording clicked");
    stopRecording();
  };

  const _handleDownloadAudio = async () => {
    try {
      await saveAudioLocally();
      toast({
        title: "Success",
        description: "Audio saved!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save audio",
        variant: "destructive",
      });
    }
  };

  const isCapturing = state === "recording" || state === "paused";

  // The expanded view shows the back whenever a session is underway, not just
  // when it was started from the expanded record button -- a recording begun
  // in the mini layout must still be visible after resizing to the full one.
  const showBack = isFlipped || state !== "idle" || showSuccess;

  // Drop any pending delete confirmation once the recording ends.
  useEffect(() => {
    if (!isCapturing) setConfirmingDelete(false);
  }, [isCapturing]);

  const handleConfirmDelete = () => {
    discardRecording();
    setConfirmingDelete(false);
    setIsFlipped(false);
  };

  const handleReset = () => {
    reset();
    setIsFlipped(false);
    setShowSuccess(false);
  };

  // Generate waveform visualization with scrolling effect
  const waveformBars = useMemo(() => {
    const numVisibleBars = 50;
    const bars = [];

    if (state === "recording" && waveformHistory.length > 0) {
      // Show a continuous scrolling waveform
      // We'll display the last numVisibleBars samples, each sample contributing one bar
      const historyToShow = Math.min(waveformHistory.length, numVisibleBars);
      const startIndex = Math.max(0, waveformHistory.length - numVisibleBars);

      for (let i = 0; i < historyToShow; i++) {
        const frameData = waveformHistory[startIndex + i];
        // Average the frequency data for this frame to get one bar height
        const avgValue =
          frameData.reduce((sum, val) => sum + val, 0) / frameData.length;

        // Apply non-linear scaling
        const normalizedValue = Math.sqrt(avgValue / 255);
        const height = Math.max(3, normalizedValue * 48);

        bars.push(
          <div
            key={`bar-${startIndex + i}`}
            className={styles.waveformBar}
            style={{
              height: `${height}px`,
              transition: "height 0.1s ease-out",
            }}
          />,
        );
      }

      // Fill remaining space with silent bars if needed
      for (let i = historyToShow; i < numVisibleBars; i++) {
        bars.push(
          <div
            key={`fill-${i}`}
            className={styles.waveformBar}
            style={{ height: "3px" }}
          />,
        );
      }
    } else {
      // Default static bars when not recording
      for (let i = 0; i < numVisibleBars; i++) {
        bars.push(
          <div
            key={i}
            className={styles.waveformBar}
            style={{ height: "3px" }}
          />,
        );
      }
    }

    return bars;
  }, [state, waveformHistory]);

  const { ref, isMini } = useWidgetHeight();

  // Waveform for mini mode: enough bars to fill the row at any width. The
  // container is right-aligned and clips overflow, so narrow widgets drop the
  // oldest bars (left) and the live end (right) is always visible.
  const miniWaveformBars = useMemo(() => {
    if (state !== "recording" && state !== "paused") return null;

    const numVisibleBars = MAX_WAVEFORM_FRAMES;
    const recent = waveformHistory.slice(-numVisibleBars);
    const padding = numVisibleBars - recent.length;
    const bars = [];

    for (let i = 0; i < numVisibleBars; i++) {
      // Silent placeholders first, so recorded bars build up from the right
      const frameData = i >= padding ? recent[i - padding] : undefined;
      let height = 3;
      if (frameData) {
        const avgValue =
          frameData.reduce((sum, val) => sum + val, 0) / frameData.length;
        height = Math.max(3, Math.sqrt(avgValue / 255) * 20);
      }

      bars.push(
        <div
          key={`mini-bar-${i}`}
          className={styles.miniWaveformBar}
          style={{ height: `${height}px` }}
        />,
      );
    }
    return bars;
  }, [state, waveformHistory]);

  return (
    <ClientOnly>
      <div
        ref={ref}
        style={{ width: "100%", height: "100%" }}
        className={className}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isMini ? (
            <motion.div
              key="mini"
              className={styles.modeWrapper}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <WidgetContainer>
                <div className={styles.miniContainer}>
                  {choiceOpen ? (
                    choiceCard
                  ) : showSuccess ? (
                    <div className={styles.miniCompleteContainer}>
                      <div className={styles.miniCompleteMessage}>
                        <CheckIcon size={14} className={styles.successCheckIcon} />
                        <span>Saved to Notes</span>
                      </div>
                      {downloadLine}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <Button
                          size="sm"
                          onClick={handleRecordNew}
                          className={styles.miniViewNoteButton}
                        >
                          Record new
                        </Button>
                        {createdNoteId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleViewNote}
                            className={styles.miniViewNoteButton}
                          >
                            View note
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : state === "idle" ? (
                    // The whole row is the click target; the Button gives it a
                    // real button look (and keyboard focus -- its click
                    // bubbles here, so it needs no handler of its own).
                    <div
                      onClick={startRecording}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      className={styles.miniIdleRow}
                    >
                      {/* Named by the visible text (aria-labelledby), not
                          aria-label, so Button doesn't add a duplicate tooltip */}
                      <Button size="icon" aria-labelledby={miniStartLabelId}>
                        {/* Same dot + hover glow as the large widget's record button */}
                        <span
                          className={cn(styles.recordingDot, styles.miniRecordDot, {
                            [styles.recordingDotHover]: isHovered,
                          })}
                        />
                      </Button>
                      <span id={miniStartLabelId} className={styles.miniIdleText}>
                        Start recording
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.miniStatusGroup}>
                        <div
                          className={
                            state === "recording"
                              ? styles.miniPulseDotRecording
                              : styles.miniPulseDotPaused
                          }
                        />
                        <span className={styles.timer}>
                          {formatTime(duration)}
                        </span>
                      </div>

                      <div className={styles.miniMiddleContent}>
                        {state === "recording" || state === "paused" ? (
                          <div className={styles.miniWaveformContainer}>
                            {miniWaveformBars}
                          </div>
                        ) : (
                          <div className={styles.miniProcessingWrapper}>
                            <span className={styles.miniProcessingText}>
                              Saving note...
                            </span>
                            <div className={styles.miniProgressTrack}>
                              <div className={styles.miniProgressFill} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.miniControlsGroup}>
                        {isCapturing &&
                          (confirmingDelete ? (
                            <DeleteConfirm
                              onCancel={() => setConfirmingDelete(false)}
                              onConfirm={handleConfirmDelete}
                            />
                          ) : (
                            <>
                              {/* Wide enough: all controls in a row */}
                              <div className={styles.miniControlsFull}>
                                <Button
                                  size="icon"
                                  onClick={toggleMute}
                                  tooltipLabel={isMuted ? "Unmute" : "Mute"}
                                >
                                  <img
                                    src={
                                      isMuted
                                        ? "/icons/si_micMute-fill.svg"
                                        : "/icons/si_mic-fill.svg"
                                    }
                                    alt=""
                                    className={styles.controlIcon}
                                  />
                                </Button>
                                <PauseResumeButton
                                  state={state}
                                  onPause={pauseRecording}
                                  onResume={resumeRecording}
                                />
                                <DeleteButton
                                  onClick={() => setConfirmingDelete(true)}
                                />
                                <TranscribeButton onClick={handleStopRecording} />
                              </div>

                              {/* Too narrow: collapse the secondary actions into a
                                  drop-up menu, keep Complete as a button */}
                              <div className={styles.miniControlsCollapsed}>
                                <SimpleDropdown
                                  align="right"
                                  direction="up"
                                  trigger={(open) => (
                                    <Button
                                      size="icon"
                                      tooltipLabel={open ? undefined : "More actions"}
                                    >
                                      <span className={styles.miniMenuDots}>⋮</span>
                                    </Button>
                                  )}
                                >
                                  <SimpleDropdownItem onClick={toggleMute}>
                                    <MicIcon size={16} />
                                    {isMuted ? "Unmute" : "Mute"}
                                  </SimpleDropdownItem>
                                  <SimpleDropdownItem
                                    onClick={
                                      state === "paused"
                                        ? resumeRecording
                                        : pauseRecording
                                    }
                                  >
                                    <PauseIcon size={14} />
                                    {state === "paused" ? "Resume" : "Pause"}
                                  </SimpleDropdownItem>
                                  <SimpleDropdownItem
                                    variant="danger"
                                    onClick={() => setConfirmingDelete(true)}
                                  >
                                    <TrashIcon size={16} />
                                    Delete
                                  </SimpleDropdownItem>
                                </SimpleDropdown>
                                <TranscribeButton onClick={handleStopRecording} />
                              </div>
                            </>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </WidgetContainer>
            </motion.div>
          ) : (
            <motion.div
              key="normal"
              className={styles.modeWrapper}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {choiceOpen ? choiceCard : (
              <div
                className={cn(styles.flipContainer, {
                  [styles.flipped]: showBack,
                })}
              >
            <div className={styles.flipper}>
              {/* Front Side (Idle) */}
              <div className={styles.front}>
                <div className={styles.container}>
                  <div className={styles.content}>
                    {/* Header */}
                    <WidgetHeader
                      title="Voice memo"
                      className="!justify-start"
                    />

                    {/* Body */}
                    <div className={styles.body}>
                      {/* Button Container */}
                      <div className={styles.buttonContainer}>
                        <button
                          onClick={handleStartRecording}
                          aria-label="Start recording"
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                          className={cn(styles.button, "group")}
                        >
                          <div className={styles.buttonOuter}>
                            {/* Main shading background */}
                            <div className={styles.buttonBackground} />
    
                            {/* Gradient border */}
                            <div className={styles.buttonBorder} />
    
                            {/* Top highlight for lighter upper half */}
                            <div className={styles.buttonTopHighlight} />
    
                            {/* Recording indicator dot (positioned top-right) */}
                            <div
                              className={cn(styles.recordingDot, {
                                [styles.recordingDotHover]: isHovered,
                              })}
                            />
                          </div>
                        </button>
                      </div>

                      {/* Text */}
                      <p className={styles.bodyText}>Start recording</p>
                      {downloadLine}
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Side (Recording) */}
              <div className={styles.back}>
                <div
                  className={cn(styles.container, {
                    [styles.containerInfoState]:
                      state === "requesting-permission",
                    [styles.containerErrorState]: state === "permission-denied",
                  })}
                >
                  <div className={styles.content}>
                    {/* Header */}
                    <WidgetHeader title="Voice notes" />

                    {/* Body */}
                    <div className={styles.recordingBody}>
                      {state === "requesting-permission" ||
                        state === "permission-denied" ? (
                        <>
                          <p className={styles.permissionTitle}>
                            {state === "requesting-permission"
                              ? "Requesting microphone permission"
                              : "Microphone permissions blocked"}
                          </p>
                          <p className={styles.permissionText}>
                            {state === "requesting-permission" ? (
                              <>
                                If you don't see the request, click the{" "}
                                <img
                                  src="/icons/si_info-line.svg"
                                  alt="info icon"
                                  style={{
                                    display: "inline",
                                    width: "14px",
                                    height: "14px",
                                    verticalAlign: "middle",
                                  }}
                                />{" "}
                                icon next to the URL address bar.
                              </>
                            ) : (
                              <>
                                To enable, click the{" "}
                                <img
                                  src="/icons/si_info-line.svg"
                                  alt="info icon"
                                  style={{
                                    display: "inline",
                                    width: "14px",
                                    height: "14px",
                                    verticalAlign: "middle",
                                  }}
                                />{" "}
                                icon next to the URL address bar.
                              </>
                            )}
                          </p>
                          {state === "permission-denied" && (
                            <button
                              onClick={() => {
                                reset();
                                handleStartRecording();
                              }}
                              className={styles.permissionRetry}
                            >
                              Click here to retry
                            </button>
                          )}
                        </>
                      ) : state === "processing" && !showSuccess ? (
                        <div className={styles.transcribingWrapper}>
                          <div className={styles.transcribingContent}>
                            <p className={styles.transcribingTitle}>
                              Saving note...
                            </p>
                            <div className={styles.transcribingProgressTrack}>
                              <div className={styles.transcribingProgressFill} />
                            </div>
                            <p className={styles.transcribingSubtitle}>
                              {downloadingModel
                                ? "Downloading model (one time)…"
                                : "Moving to Notes..."}
                            </p>
                          </div>
                          <button
                            onClick={handleReset}
                            className={styles.okButton}
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Status: recording dot + timer + waveform ONLY while capturing (not when complete) */}
                          {isCapturing && (
                            <div className={styles.statusRow}>
                              <div
                                className={
                                  state === "recording"
                                    ? styles.miniPulseDotRecording
                                    : styles.miniPulseDotPaused
                                }
                              />
                              <p className={styles.timer}>
                                {formatTime(duration)}
                              </p>
                              <div className={styles.waveformContainer}>
                                {waveformBars}
                              </div>
                            </div>
                          )}

                          {/* Controls */}
                          <div className={styles.recordingControls}>
                            <RecordingControls
                              state={state}
                              isMuted={isMuted}
                              showSuccess={showSuccess}
                              confirmingDelete={confirmingDelete}
                              onToggleMute={toggleMute}
                              onPause={pauseRecording}
                              onResume={resumeRecording}
                              onRequestDelete={() => setConfirmingDelete(true)}
                              onCancelDelete={() => setConfirmingDelete(false)}
                              onConfirmDelete={handleConfirmDelete}
                              onTranscribe={handleStopRecording}
                              onViewNote={handleViewNote}
                              onRecordNew={handleRecordNew}
                            />
                          </div>
                          {showSuccess ? downloadLine : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
              )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</ClientOnly>
  );
}
