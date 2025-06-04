import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Task } from "@shared/schema";

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete: (taskId: number) => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

export default function TaskEditModal({ task, isOpen, onClose, onSave, onDelete, triggerRef }: TaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"todo" | "inprogress" | "review">("todo");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      // Map old priority values to new ones
      const priorityMap: Record<string, "todo" | "inprogress" | "review"> = {
        "low": "todo",
        "medium": "inprogress", 
        "high": "review"
      };
      setPriority(priorityMap[task.priority] || "todo");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setShowDeleteConfirm(false);
    }
  }, [task, isOpen]);

  const handleSave = () => {
    if (!task) return;
    
    onSave({
      id: task.id,
      title,
      description,
      priority,
      dueDate,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    onClose();
  };

  const getInitialPosition = () => {
    if (!triggerRef?.current) return { x: 0, y: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate offset from center of screen
    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;
    const taskCenterX = rect.left + rect.width / 2;
    const taskCenterY = rect.top + rect.height / 2;
    
    return {
      x: taskCenterX - centerX,
      y: taskCenterY - centerY,
    };
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{
              opacity: 0,
              scale: 0.1,
              x: getInitialPosition().x,
              y: getInitialPosition().y,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.1,
              x: getInitialPosition().x,
              y: getInitialPosition().y,
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Edit Task</h2>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="h-8 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      className="h-8 px-2 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task description..."
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Status
                  </label>
                  <Select value={priority} onValueChange={(value: "todo" | "inprogress" | "review") => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="inprogress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Due Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Select due date..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}