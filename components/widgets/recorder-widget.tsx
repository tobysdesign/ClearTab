"use client";

// Icons replaced with ASCII placeholders
import { useState, useEffect, memo, useMemo, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, PauseIcon, TrashIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import styles from "./recorder-widget.module.css";
import {
  Button,
  WidgetHeader,
  BrandedLoader,
  WidgetContainer,
  ClientOnly,
} from "@cleartab/ui";
import { useToast } from "@cleartab/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { isExtensionEnvironment } from "@/lib/extension-utils";
import { apiFetch } from "@/lib/api-fetch";
import { stringToQuillDelta } from "@/lib/quill-utils";
import { useWidgetHeight } from "@/hooks/use-widget-height";

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
          <span>Transcription complete.</span>
        </div>
        {onViewNote && (
          <Button size="sm" onClick={onViewNote}>
            View note
          </Button>
        )}
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
  const { toast } = useToast();

  // Use auth
  const { user } = useAuth();

  const handleViewNote = useCallback(() => {
    if (createdNoteId && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("select-note", { detail: { id: createdNoteId } })
      );
    }
    setShowSuccess(false);
    setIsFlipped(false);
    setCreatedNoteId(null);
  }, [createdNoteId]);

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
    saveAudioLocally,
    reset,
    discardRecording,
  } = useAudioRecorder({
    onTranscriptionComplete: async (text: string) => {
      console.log("Transcription complete:", text);
      try {
        if (!user) {
          toast({
            title: "Error",
            description: "You must be logged in to save voice memos",
            variant: "destructive",
          });
          return;
        }

        console.log("Saving note for user:", user.id);

        // Save note through the notes API
        const response = await apiFetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Voice Note", content: stringToQuillDelta(text) }),
        });
        const result: { success?: boolean; data?: { id?: string }; error?: string } = await response
          .json()
          .catch(() => ({}));

        if (!response.ok || !result.success) {
          console.error("Error saving note:", result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to save voice note",
            variant: "destructive",
          });
          return;
        }

        console.log("Note saved successfully:", result);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("note-created", { detail: result }));
        }

        // Extract saved note id
        const noteId = result.data?.id;
        if (noteId) {
          setCreatedNoteId(noteId);
        }

        toast({
          title: "Success",
          description: "Transcription complete.",
        });

        console.log("Setting showSuccess to true");
        setShowSuccess(true);
        setTimeout(() => {
          console.log("Hiding success and resetting");
          setShowSuccess(false);
          setIsFlipped(false);
          reset();
          setCreatedNoteId(null);
        }, 6000);
      } catch (error: unknown) {
        console.error("Error processing transcription:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error details:", errorMessage);
        toast({
          title: "Error",
          description: errorMessage || "Failed to process transcription",
          variant: "destructive",
        });
        // Reset state on error
        reset();
      }
    },
    onError: (error: string) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Watch for when audio blob is ready and automatically transcribe
  useEffect(() => {
    if (state === "processing" && audioBlob && !showSuccess) {
      console.log("Audio blob ready, starting transcription...");
      transcribeAudio();
    }
  }, [state, audioBlob, showSuccess, transcribeAudio]);

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
                  {showSuccess ? (
                    <div className={styles.miniCompleteContainer}>
                      <div className={styles.miniCompleteMessage}>
                        <CheckIcon size={14} className={styles.successCheckIcon} />
                        <span>Transcription complete.</span>
                      </div>
                      {createdNoteId && (
                        <Button
                          size="sm"
                          onClick={handleViewNote}
                          className={styles.miniViewNoteButton}
                        >
                          View note
                        </Button>
                      )}
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
                          <span className={styles.miniProcessingText}>
                            Transcribing note...
                          </span>
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
                              <PauseResumeButton
                                state={state}
                                onPause={pauseRecording}
                                onResume={resumeRecording}
                              />
                              <DeleteButton
                                onClick={() => setConfirmingDelete(true)}
                              />
                              <TranscribeButton onClick={handleStopRecording} />
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
                              Transcribing note...
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
                          {/* Status: recording dot + timer + waveform (same order as mini) */}
                          <div className={styles.statusRow}>
                            {isCapturing && (
                              <div
                                className={
                                  state === "recording"
                                    ? styles.miniPulseDotRecording
                                    : styles.miniPulseDotPaused
                                }
                              />
                            )}
                            <p className={styles.timer}>
                              {formatTime(duration)}
                            </p>
                            <div className={styles.waveformContainer}>
                              {waveformBars}
                            </div>
                          </div>

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
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</ClientOnly>
  );
}
