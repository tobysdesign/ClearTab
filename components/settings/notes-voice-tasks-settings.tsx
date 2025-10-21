"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import styles from "./notes-voice-tasks-settings.module.css";

export function NotesVoiceTasksSettings() {
  const { toast } = useToast();
  const [showNotesWipeDialog, setShowNotesWipeDialog] = useState(false);
  const [showTasksWipeDialog, setShowTasksWipeDialog] = useState(false);
  const [showVoiceWipeDialog, setShowVoiceWipeDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingNotes, setIsDeletingNotes] = useState(false);

  const handleExportNotes = async () => {
    // TODO: Implement notes export functionality
    console.log("Exporting notes...");
  };

  const handleExportTasks = async () => {
    // TODO: Implement tasks export functionality
    console.log("Exporting tasks...");
  };

  const handleExportVoice = async () => {
    // TODO: Implement voice export functionality
    console.log("Exporting voice notes...");
  };

  const handleWipeNotes = async () => {
    setIsDeletingNotes(true);

    // Show progress toast
    const progressToast = toast({
      title: "Deleting Notes",
      description: "Please wait while we delete all your notes...",
      duration: Infinity, // Don't auto-dismiss
    });

    try {
      const res = await fetch('/api/notes/delete-all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete all notes');
      }

      const result = await res.json();

      // Dismiss progress toast
      progressToast.dismiss();

      // Show success toast that user can dismiss
      toast({
        title: "Notes Deleted Successfully",
        description: `Successfully deleted ${result.deletedCount} note${result.deletedCount === 1 ? '' : 's'}`,
        duration: Infinity, // User must dismiss manually
      });

      console.log("All notes deleted successfully");
    } catch (error) {
      console.error('Error wiping notes:', error);

      // Dismiss progress toast
      progressToast.dismiss();

      // Show error toast
      toast({
        title: "Error Deleting Notes",
        description: `Failed to delete all notes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: Infinity, // User must dismiss manually
      });
    } finally {
      setIsDeletingNotes(false);
      setShowNotesWipeDialog(false);
    }
  };

  const handleWipeTasks = async () => {
    setIsDeleting(true);

    // Show progress toast
    const progressToast = toast({
      title: "Deleting Tasks",
      description: "Please wait while we delete all your tasks...",
      duration: Infinity, // Don't auto-dismiss
    });

    try {
      const res = await fetch('/api/tasks/delete-all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete all tasks');
      }

      const result = await res.json();

      // Dismiss progress toast
      progressToast.dismiss();

      // Show success toast that user can dismiss
      toast({
        title: "Tasks Deleted Successfully",
        description: `Successfully deleted ${result.deletedCount} task${result.deletedCount === 1 ? '' : 's'}`,
        duration: Infinity, // User must dismiss manually
      });

      console.log("All tasks deleted successfully");
    } catch (error) {
      console.error('Error wiping tasks:', error);

      // Dismiss progress toast
      progressToast.dismiss();

      // Show error toast
      toast({
        title: "Error Deleting Tasks",
        description: `Failed to delete all tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: Infinity, // User must dismiss manually
      });
    } finally {
      setIsDeleting(false);
      setShowTasksWipeDialog(false);
    }
  };

  const handleWipeVoice = async () => {
    // TODO: Implement voice wipe functionality
    console.log("Wiping voice notes...");
    setShowVoiceWipeDialog(false);
  };

  return (
    <div className={styles.container}>
      {/* Notes Section */}
      <div className={styles.compactSection}>
        <div className={styles.compactRow}>
          <div className={styles.compactInfo}>
            <div className={styles.compactTitle}>Notes</div>
            <div className={styles.compactDescription}>Manage your written notes data</div>
          </div>
          <div className={styles.compactActions}>
            <Button
              variant="outline"
              onClick={handleExportNotes}
              className={styles.compactButton}
            >
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.menuButton}
                  disabled={showNotesWipeDialog}
                >
                  ⋮
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowNotesWipeDialog(true)}
                  className="text-red-400 focus:text-red-300"
                >
                  Delete all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className={styles.compactSection}>
        <div className={styles.compactRow}>
          <div className={styles.compactInfo}>
            <div className={styles.compactTitle}>Tasks</div>
            <div className={styles.compactDescription}>Manage your tasks and to-do items</div>
          </div>
          <div className={styles.compactActions}>
            <Button
              variant="outline"
              onClick={handleExportTasks}
              className={styles.compactButton}
            >
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.menuButton}
                  disabled={showTasksWipeDialog}
                >
                  ⋮
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowTasksWipeDialog(true)}
                  className="text-red-400 focus:text-red-300"
                >
                  Delete all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Voice Section */}
      <div className={styles.compactSection}>
        <div className={styles.compactRow}>
          <div className={styles.compactInfo}>
            <div className={styles.compactTitle}>Voice</div>
            <div className={styles.compactDescription}>Manage your voice notes and recordings</div>
          </div>
          <div className={styles.compactActions}>
            <Button
              variant="outline"
              onClick={handleExportVoice}
              className={styles.compactButton}
            >
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.menuButton}
                  disabled={showVoiceWipeDialog}
                >
                  ⋮
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowVoiceWipeDialog(true)}
                  className="text-red-400 focus:text-red-300"
                >
                  Delete all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <Dialog open={showNotesWipeDialog} onOpenChange={setShowNotesWipeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wipe All Notes</DialogTitle>
            <DialogDescription>
              This action is permanent, are you sure? All your notes will be permanently deleted and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotesWipeDialog(false)}
              disabled={isDeletingNotes}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWipeNotes}
              disabled={isDeletingNotes}
            >
              {isDeletingNotes ? "Deleting..." : "Yes, Wipe Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTasksWipeDialog} onOpenChange={setShowTasksWipeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wipe All Tasks</DialogTitle>
            <DialogDescription>
              This action is permanent, are you sure? All your tasks will be permanently deleted and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTasksWipeDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWipeTasks}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Wipe Tasks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVoiceWipeDialog} onOpenChange={setShowVoiceWipeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wipe All Voice Notes</DialogTitle>
            <DialogDescription>
              This action is permanent, are you sure? All your voice recordings will be permanently deleted and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoiceWipeDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleWipeVoice}>
              Yes, Wipe Voice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}