import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X, Calendar, Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatContext } from "@/hooks/use-chat-context";
import { EmotionalStates } from "@/components/emotional-states";
import type { Task } from "@shared/schema";
import { format } from "date-fns";
import TaskEditModal from "@/components/task-edit-modal";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TasksWidget() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const taskRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateTaskPriority = useMutation({
    mutationFn: async ({ id, priority }: { id: number; priority: string }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { priority });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { 
        completed: completed
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (taskUpdate: Partial<Task> & { id: number }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskUpdate.id}`, taskUpdate);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const handleExpandTask = (task: Task, event: React.MouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    
    setCardPosition({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    });
    
    setExpandedTask(task);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeExpandedTask = () => {
    setExpandedTask(null);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedTask) {
        closeExpandedTask();
      }
    };

    if (expandedTask) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [expandedTask]);

  const handleSaveTask = (taskUpdate: Partial<Task>) => {
    if (taskUpdate.id) {
      // Update existing task
      updateTask.mutate(taskUpdate as Partial<Task> & { id: number });
    } else {
      // Create new task
      createTask.mutate(taskUpdate);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: number) => {
    deleteTaskMutation.mutate(taskId);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const createTask = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const response = await apiRequest("POST", "/api/tasks", newTask);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const handleDuplicateTask = (task: Task) => {
    const duplicatedTask = {
      title: `${task.title} (Copy)`,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      completed: false
    };
    createTask.mutate(duplicatedTask);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const deleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const getPriorityColor = (priority: string) => {
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Card className="bg-card text-card-foreground border-border h-full flex flex-col relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between h-4">
          <CardTitle className="text-[13px] font-aileron-black text-muted-foreground leading-none">
            Tasks
          </CardTitle>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-6 h-6 bg-muted hover:bg-muted/80 rounded-sm flex items-center justify-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col overflow-hidden pb-0">
        {/* CRITICAL: tasks-widget-scrollable class enables scrolling - DO NOT REMOVE */}
        <div className="flex-1 tasks-widget-scrollable widget-scrollable">
          <div className="space-y-2 p-1 max-h-full">
            {isLoading ? (
              <EmotionalStates.LoadingTasks />
            ) : tasks.length === 0 ? (
              <EmotionalStates.NoTasks />
            ) : (
              tasks.map((task) => (
                <div 
                  key={task.id} 
                  ref={(el) => { taskRefs.current[task.id] = el; }}
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group border border-solid border-transparent hover:border-[#333333] cursor-pointer"
                  onClick={(e) => handleExpandTask(task, e)}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => toggleTaskStatus.mutate({ id: task.id, completed: checked as boolean })}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm mb-1 text-[#d4d4d4]">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs mb-2 line-clamp-2 text-[#a1a1a1]">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due: {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
      {/* Blur fade effect */}
      <div className="blur-fade"></div>
      
      {/* Expandable Task Overlay */}
      <AnimatePresence>
        {expandedTask && (
          <>
            {/* Background overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeExpandedTask}
            />
            
            {/* Expandable card */}
            <motion.div
              className="fixed z-[9999] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
              layoutId={`task-${expandedTask.id}`}
              initial={{
                x: cardPosition.x,
                y: cardPosition.y,
                width: cardPosition.width,
                height: cardPosition.height,
              }}
              animate={{
                x: "50%",
                y: "50%",
                width: "min(90vw, 600px)",
                height: "min(80vh, 500px)",
                translateX: "-50%",
                translateY: "-50%",
              }}
              exit={{
                x: cardPosition.x,
                y: cardPosition.y,
                width: cardPosition.width,
                height: cardPosition.height,
                translateX: 0,
                translateY: 0,
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.5
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={expandedTask.completed}
                      onCheckedChange={(checked) => {
                        toggleTaskStatus.mutate({ id: expandedTask.id, completed: checked as boolean });
                        setExpandedTask({ ...expandedTask, completed: checked as boolean });
                      }}
                      className="mt-1"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        {expandedTask.title}
                      </h2>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={getPriorityColor(expandedTask.priority)}>
                          <Flag className="w-3 h-3 mr-1" />
                          {expandedTask.priority}
                        </Badge>
                        {expandedTask.dueDate && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {format(new Date(expandedTask.dueDate), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        closeExpandedTask();
                        handleEditTask(expandedTask);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeExpandedTask}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {expandedTask.description ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {expandedTask.description}
                      </p>
                    </div>
                    
                    {expandedTask.createdAt && (
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          Created: {format(new Date(expandedTask.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No description provided</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        closeExpandedTask();
                        handleEditTask(expandedTask);
                      }}
                    >
                      Add Description
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <TaskEditModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
        triggerRef={editingTask ? { current: taskRefs.current[editingTask.id] } : undefined}
      />
    </Card>
  );
}