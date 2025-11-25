"use client";

// Icons replaced with ASCII placeholders
import { useState, useEffect, memo, useMemo } from "react";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import styles from "./recorder-widget.module.css";
import { ClientOnly } from "@cleartab/ui";
import { WidgetHeader, BrandedLoader } from "@cleartab/ui";
import { useToast } from "@cleartab/ui";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  getSupabaseClient,
  isExtensionEnvironment,
} from "@/lib/extension-utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@cleartab/ui";

interface RecorderWidgetProps {
  className?: string;
}

interface RecordingControlsProps {
  state: string;
  isMuted: boolean;
  showSuccess: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const RecordingControls = memo(function RecordingControls({
  state,
  isMuted,
  showSuccess,
  onToggleMute,
  onPause,
  onResume,
  onStop,
}: RecordingControlsProps) {
  if (state === "recording") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleMute}
              className={styles.controlButton}
            >
              <div className={styles.controlButtonInner}>
                <img
                  src={
                    isMuted
                      ? "/icons/si_micMute-fill.svg"
                      : "/icons/si_mic-fill.svg"
                  }
                  alt={isMuted ? "Unmute" : "Mute"}
                  className={styles.controlIcon}
                />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onPause}
              className={styles.controlButton}
            >
              <div className={styles.controlButtonInner}>
                <img
                  src="/icons/si_pause-fill.svg"
                  alt="Pause"
                  className={styles.controlIcon}
                />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>Pause</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onStop}
              className={cn(styles.controlButton, styles.doneButton)}
            >
              <div className={styles.controlButtonInner}>
                <CheckIcon size={16} className={styles.checkIcon} />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>Done</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (state === "paused") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleMute}
              className={styles.controlButton}
            >
              <div className={styles.controlButtonInner}>
                <img
                  src={
                    isMuted
                      ? "/icons/si_micMute-fill.svg"
                      : "/icons/si_mic-fill.svg"
                  }
                  alt={isMuted ? "Unmute" : "Mute"}
                  className={styles.controlIcon}
                />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onResume}
              className={styles.controlButton}
            >
              <div className={styles.controlButtonInner}>
                <img
                  src="/icons/si_record-fill.svg"
                  alt="Resume"
                  className={styles.controlIcon}
                />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>Resume</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onStop}
              className={cn(styles.controlButton, styles.doneButton)}
            >
              <div className={styles.controlButtonInner}>
                <CheckIcon size={16} className={styles.checkIcon} />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>Done</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (showSuccess) {
    return (
      <div className={styles.successContainer}>
        <span className={styles.controlIcon}>✓</span>
        <span className={styles.doneText}>Note saved!</span>
      </div>
    );
  }

  return null;
});

export function RecorderWidget({ className }: RecorderWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);
  const [waveformHistory, setWaveformHistory] = useState<Uint8Array[]>([]);
  const { toast } = useToast();

  // Use auth
  const { user } = useAuth();

  // Initialize Supabase client based on environment
  useEffect(() => {
    const initSupabase = async () => {
      const client = await getSupabaseClient();
      setSupabase(client);
    };
    initSupabase();
  }, []);

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
  } = useAudioRecorder({
    onTranscriptionComplete: async (text: string) => {
      console.log("Transcription complete:", text);
      try {
        if (!user) {
          toast({
            title: "Error",
            description: "You must be logged in to save voice notes",
            variant: "destructive",
          });
          return;
        }

        console.log("Saving note for user:", user.id);

        // Check if Supabase client is available (extension may be offline)
        if (!supabase) {
          console.warn("No Supabase client available, saving to local storage");

          // Save to local storage as fallback for extension
          const localNote = {
            id: Date.now().toString(),
            title: `Voice Note - ${new Date().toLocaleDateString()}`,
            content: [
              {
                id: "voice-note-block",
                type: "paragraph",
                props: {
                  textColor: "default",
                  backgroundColor: "default",
                  textAlignment: "left",
                },
                content: [{ type: "text", text, styles: {} }],
                children: [],
              },
            ],
            user_id: user.id,
            created_at: new Date().toISOString(),
          };

          const existingNotes = JSON.parse(
            localStorage.getItem("voice_notes") || "[]",
          );
          existingNotes.push(localNote);
          localStorage.setItem("voice_notes", JSON.stringify(existingNotes));

          toast({
            title: "Success",
            description: "Voice note saved locally (extension mode)",
          });

          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setIsFlipped(false);
            reset();
          }, 2000);

          return;
        }

        // Save note to Supabase
        const { data, error } = await supabase
          .from("notes")
          .insert({
            title: `Voice Note - ${new Date().toLocaleDateString()}`,
            content: [
              {
                id: "voice-note-block",
                type: "paragraph",
                props: {
                  textColor: "default",
                  backgroundColor: "default",
                  textAlignment: "left",
                },
                content: [{ type: "text", text, styles: {} }],
                children: [],
              },
            ],
            user_id: user.id,
          })
          .select();

        if (error) {
          console.error("Error saving note:", error);
          toast({
            title: "Error",
            description: "Failed to save voice note",
            variant: "destructive",
          });
          return;
        }

        console.log("Note saved successfully:", data);

        toast({
          title: "Success",
          description: "Voice note saved successfully!",
        });

        console.log("Setting showSuccess to true");
        setShowSuccess(true);
        setTimeout(() => {
          console.log("Hiding success and resetting");
          setShowSuccess(false);
          setIsFlipped(false);
          reset();
        }, 2000);
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
      // DEV: Pause here to inspect the transcribing state
      // Uncomment the next line to automatically transcribe in production
      // transcribeAudio()
      console.log(
        "DEV MODE: Pausing at transcription state. Call transcribeAudio() to continue.",
      );
    }
  }, [state, audioBlob, showSuccess, transcribeAudio]);

  // Update waveform history for scrolling effect
  useEffect(() => {
    if (state === "recording" && audioData) {
      setWaveformHistory((prev) => {
        const newHistory = [...prev, audioData];
        // Keep last 100 frames for longer, smoother scrolling (10 seconds at 10fps)
        return newHistory.slice(-100);
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

  return (
    <ClientOnly>
      <div
        className={cn(
          styles.flipContainer,
          { [styles.flipped]: isFlipped },
          className,
        )}
      >
        <div className={styles.flipper}>
          {/* Front Side (Idle) */}
          <div className={styles.front}>
            <div className={styles.container}>
              <div className={styles.content}>
                {/* Header */}
                <WidgetHeader title="Voice notes" className="!justify-start" />

                {/* Body */}
                <div className={styles.body}>
                  {/* Button Container */}
                  <div className={styles.buttonContainer}>
                    <button
                      onClick={handleStartRecording}
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
                  <p className={styles.bodyText}>Start a voice note</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Side (Recording) */}
          <div className={styles.back}>
            <div
              className={cn(styles.container, {
                [styles.containerInfoState]: state === "requesting-permission",
                [styles.containerErrorState]: state === "permission-denied",
              })}
            >
              <div className={styles.content}>
                {/* Header */}
                <WidgetHeader title="Voice notes" className="!justify-start" />

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
                      <button onClick={handleReset} className={styles.okButton}>
                        OK
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Waveform visualization */}
                      <div className={styles.waveformContainer}>
                        {waveformBars}
                      </div>

                      {/* Timer */}
                      <div className={styles.timerContainer}>
                        <p className={styles.timer}>{formatTime(duration)}</p>
                      </div>

                      {/* Controls */}
                      <div className={styles.recordingControls}>
                        <RecordingControls
                          state={state}
                          isMuted={isMuted}
                          showSuccess={showSuccess}
                          onToggleMute={toggleMute}
                          onPause={pauseRecording}
                          onResume={resumeRecording}
                          onStop={handleStopRecording}
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
    </ClientOnly>
  );
}
