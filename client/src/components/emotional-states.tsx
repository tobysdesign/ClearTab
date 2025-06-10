import { SmileFace, SadFace, BigEyeFace, SidewaysFace, DowntriddenFace, UpconfusedFace } from "@/components/emotional-faces";

interface EmotionalStateProps {
  state: "success" | "error" | "loading" | "empty" | "thinking" | "confused";
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function EmotionalState({ state, message, size = "md" }: EmotionalStateProps) {
  const stateConfig = {
    success: { Face: SmileFace, defaultMessage: "Great job!" },
    error: { Face: SadFace, defaultMessage: "Something went wrong" },
    loading: { Face: BigEyeFace, defaultMessage: "Working on it..." },
    empty: { Face: DowntriddenFace, defaultMessage: "Nothing here yet" },
    thinking: { Face: UpconfusedFace, defaultMessage: "Let me think..." },
    confused: { Face: SidewaysFace, defaultMessage: "Hmm, that's odd" }
  };

  const { Face, defaultMessage } = stateConfig[state];

  return (
    <div className="flex flex-col items-center space-y-2 p-4">
      <Face size={size} />
      <p className="text-sm text-muted-foreground text-center">
        {message || defaultMessage}
      </p>
    </div>
  );
}

// Pre-configured emotional states for common use cases
export const EmotionalStates = {
  TaskCompleted: () => <EmotionalState state="success" message="Task completed!" />,
  NoTasks: () => <EmotionalState state="empty" message="No tasks yet. Create your first one!" />,
  LoadingTasks: () => <EmotionalState state="loading" message="Loading your tasks..." />,
  ErrorLoading: () => <EmotionalState state="error" message="Couldn't load tasks" />,
  AIThinking: () => <EmotionalState state="thinking" message="AI is thinking..." />,
  SomethingWrong: () => <EmotionalState state="confused" message="Something unexpected happened" />
};