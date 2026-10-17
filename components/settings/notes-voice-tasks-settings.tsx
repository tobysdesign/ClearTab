"use client";

import * as React from "react";
import { Button, SimpleDropdown, SimpleDropdownItem } from "@cleartab/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DownloadIcon, MoreActionsIcon } from "@/components/icons";
import sharedStyles from "./settings-shared.module.css";
import drawerStyles from "./settings-drawer.module.css";
import { apiFetch } from "@/lib/api-fetch";
import { deltaToPlainText, migrateToQuillDelta } from "@/lib/quill-utils";

type DataDomain = "notes" | "tasks";

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
  const [exportingDomain, setExportingDomain] = React.useState<DataDomain | null>(null);

  const handleExport = async (domain: DataDomain) => {
    setExportingDomain(domain);
    try {
      const endpoint = domain === "notes" ? "/api/notes" : "/api/tasks";
      const res = await apiFetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to download ${domain}`);
      }

      const payload = await res.json();
      const rawItems: Array<Record<string, any>> = Array.isArray(payload?.data)
        ? payload.data
        : [];

      const exportedItems =
        domain === "notes"
          ? rawItems.map((note) => ({
              id: note.id,
              title: note.title ?? "Untitled",
              text: deltaToPlainText(migrateToQuillDelta(note.content)),
              createdAt: note.createdAt ?? null,
              updatedAt: note.updatedAt ?? null,
              content: note.content,
            }))
          : rawItems.map((task) => ({
              id: task.id,
              title: task.title ?? "Untitled Task",
              text: deltaToPlainText(migrateToQuillDelta(task.content)),
              isCompleted: Boolean(task.isCompleted),
              isHighPriority: Boolean(task.isHighPriority),
              dueDate: task.dueDate ?? null,
              createdAt: task.createdAt ?? null,
              updatedAt: task.updatedAt ?? null,
              content: task.content,
            }));

      const dateStamp = new Date().toISOString().slice(0, 10);
      const fileName = `cleartab-${domain}-${dateStamp}.json`;
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              type: domain,
              count: exportedItems.length,
              items: exportedItems,
            },
            null,
            2,
          ),
        ],
        { type: "application/json;charset=utf-8" },
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: `Downloaded ${domain}`,
        description: `Exported ${exportedItems.length} ${exportedItems.length === 1 ? domain.slice(0, -1) : domain} to ${fileName}`,
        duration: 3000,
      });
    } catch (error) {
      console.error(`Export error:`, error);
      toast({
        title: `Failed to download ${domain}`,
        description:
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setExportingDomain(null);
    }
  };

  const handleDelete = async (domain: DataDomain) => {
    setIsDeleting(true);

    const endpointMap: Record<DataDomain, string> = {
      notes: "/api/notes/delete-all",
      tasks: "/api/tasks/delete-all",
    };

    const progressToast = toast({
      title: `Deleting ${domain}…`,
      description: "This may take a moment",
      duration: Infinity,
    });

    try {
      console.log(`Attempting to delete ${domain} at ${endpointMap[domain]}`);

      const res = await apiFetch(endpointMap[domain], {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent
      });

      console.log(`Delete response status: ${res.status}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`Delete failed:`, errorData);
        throw new Error(errorData.error || `Failed to delete ${domain}`);
      }

      const result = await res.json().catch(() => ({}));
      console.log(`Delete result:`, result);

      progressToast.dismiss();

      // Emit event to notify widgets to refresh
      window.dispatchEvent(
        new CustomEvent('data-deleted-all', {
          detail: { domain }
        })
      );

      toast({
        title: `All ${domain} deleted`,
        description: result.deletedCount
          ? `Removed ${result.deletedCount} ${domain}`
          : "All data cleared successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error(`Delete error:`, error);
      progressToast.dismiss();
      toast({
        title: `Failed to delete ${domain}`,
        description:
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again",
        variant: "destructive",
        duration: 4000,
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
      description: "Download or reset your written and transcribed voice notes.",
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

        <div className={sharedStyles.rowGroup}>
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
              disabled={exportingDomain === item.key}
              tooltipLabel={`Download ${item.title.toLowerCase()}`}
              shortcut="⌘S"
            >
              <DownloadIcon size={16} aria-hidden />
              {exportingDomain === item.key ? "Downloading…" : "Download"}
            </Button>
            <SimpleDropdown
              key={`dropdown-${item.key}`}
              trigger={
                <Button
                  className={`${sharedStyles.button} ${sharedStyles.buttonIcon}`}
                  aria-label={`More actions for ${item.title}`}
                  tooltipLabel={`More actions for ${item.title}`}
                  shortcut="⌘/."
                >
                  <MoreActionsIcon size={16} aria-hidden />
                </Button>
              }
            >
              <SimpleDropdownItem
                onClick={() => setConfirmState({ domain: item.key })}
                variant="danger"
              >
                Delete all
              </SimpleDropdownItem>
            </SimpleDropdown>
          </div>
        ))}
        </div>
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
              onClick={() => {
                console.log('Delete button clicked, activeDomain:', activeDomain);
                if (activeDomain) {
                  handleDelete(activeDomain);
                }
              }}
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
