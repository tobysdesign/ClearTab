"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { DownloadIcon, MoreActionsIcon } from "@/components/icons";
import sharedStyles from "./settings-shared.module.css";
import drawerStyles from "./settings-drawer.module.css";

type DataDomain = "notes" | "tasks" | "voice";

interface ConfirmState {
  domain: DataDomain | null;
}

interface NotesVoiceTasksSettingsProps {
  sectionId: string;
  heading: string;
  description?: string;
}

export const NotesVoiceTasksSettings = React.forwardRef<
  HTMLElement,
  NotesVoiceTasksSettingsProps
>(function NotesVoiceTasksSettings({ sectionId, heading, description }, ref) {
  const { toast } = useToast();
  const [confirmState, setConfirmState] = React.useState<ConfirmState>({
    domain: null,
  });
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleExport = (domain: DataDomain) => {
    console.log(`Exporting ${domain}…`);
    // TODO: replace with actual export implementation.
  };

  const handleDelete = async (domain: DataDomain) => {
    setIsDeleting(true);

    const endpointMap: Record<DataDomain, string> = {
      notes: "/api/notes/delete-all",
      tasks: "/api/tasks/delete-all",
      voice: "/api/voice/delete-all",
    };

    const progressToast = toast({
      title: `Deleting ${domain}`,
      description: "This may take a moment…",
      duration: Infinity,
    });

    try {
      const res = await fetch(endpointMap[domain], {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete ${domain}`);
      }

      const result = await res.json().catch(() => ({}));
      progressToast.dismiss();

      toast({
        title: "Delete complete",
        description: result.deletedCount
          ? `Removed ${result.deletedCount} ${domain}`
          : "All data cleared successfully.",
        duration: 6000,
      });
    } catch (error) {
      progressToast.dismiss();
      toast({
        title: "Delete failed",
        description:
          error instanceof Error
            ? error.message
            : "We couldn’t complete the delete request. Please try again.",
        variant: "destructive",
        duration: Infinity,
      });
    } finally {
      setIsDeleting(false);
      setConfirmState({ domain: null });
    }
  };

  const dataSets: Array<{
    key: DataDomain;
    title: string;
    description: string;
  }> = [
    {
      key: "notes",
      title: "Notes",
      description: "Download or reset your written notes.",
    },
    {
      key: "voice",
      title: "Voice notes",
      description: "Manage recordings captured from the voice widget.",
    },
    {
      key: "tasks",
      title: "Tasks",
      description: "Export or clear completed and scheduled tasks.",
    },
  ];

  const activeDomain = confirmState.domain;

  return (
    <section
      ref={ref}
      className={sharedStyles.card}
      data-section-id={sectionId}
    >
      <div className={sharedStyles.rowList}>
        <div className={sharedStyles.rowListHeader}>
          <div className={drawerStyles.sectionHeading}>
            <h2 className={drawerStyles.sectionTitle}>{heading}</h2>
            {description ? (
              <p className={drawerStyles.sectionDescription}>{description}</p>
            ) : null}
          </div>
        </div>

        {dataSets.map((item) => (
          <div key={item.key} className={sharedStyles.row}>
            <div className={sharedStyles.rowMeta}>
              <div>
                <div className={sharedStyles.rowTitle}>{item.title}</div>
                <div className={sharedStyles.rowDescription}>{item.description}</div>
              </div>
            </div>
            <span />
            <Button
              className={`${sharedStyles.button} ${sharedStyles.buttonPill}`}
              onClick={() => handleExport(item.key)}
            >
              <DownloadIcon size={16} aria-hidden />
              Download
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={`${sharedStyles.button} ${sharedStyles.buttonIcon}`}
                  aria-label={`More actions for ${item.title}`}
                >
                  <MoreActionsIcon size={16} aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-300"
                  onClick={() => setConfirmState({ domain: item.key })}
                >
                  Delete all data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Dialog
        open={Boolean(activeDomain)}
        onOpenChange={(open) => !open && setConfirmState({ domain: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeDomain ? `Delete all ${activeDomain}` : "Confirm delete"}
            </DialogTitle>
            <DialogDescription>
              This cannot be undone. The selected dataset will be permanently
              removed from ClearTab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmState({ domain: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => activeDomain && handleDelete(activeDomain)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
});

NotesVoiceTasksSettings.displayName = "NotesVoiceTasksSettings";
