import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatContext } from "@/hooks/use-chat-context";
import { EmotionalStates } from "@/components/emotional-states";
import { SmileFace } from "@/components/emotional-faces";
import type { Task } from "@shared/schema";
import { format } from "date-fns";
import TaskEditModal from "@/components/task-edit-modal";
import { useState, useRef } from "react";

export default function TasksWidget() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

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
        <div className="flex-1 overflow-y-auto min-h-0 widget-scrollable">
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
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group border border-solid border-transparent hover:border-[#333333]"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => toggleTaskStatus.mutate({ id: task.id, completed: checked as boolean })}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm mb-1 cursor-pointer hover:text-foreground transition-colors text-[#d4d4d4]"
                      onClick={() => handleEditTask(task)}
                    >
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