import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckSquare, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function TasksWidget() {
  const queryClient = useQueryClient();
  
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const handleToggleTask = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({ id, data: { completed } });
  };

  const handleDeleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-muted text-text-muted';
      case 'low': return 'bg-accent text-text-muted';
      default: return 'bg-muted text-text-muted';
    }
  };

  return (
    <div className="widget tasks-widget">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Tasks</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs text-text-muted bg-muted">
            Ctrl+T
          </Badge>
          <CheckSquare className="h-5 w-5 text-text-secondary" />
        </div>
      </div>
      
      <div className="flex-1 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 rounded-lg animate-pulse">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs mt-1">Press Ctrl+/ to start adding tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-dark-primary transition-colors cursor-pointer group"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                className="border-dark-border"
              />
              <div className="flex-1">
                <p className={`text-sm font-medium text-text-primary ${task.completed ? 'line-through opacity-60' : ''}`}>
                  {task.title}
                </p>
                <p className="text-xs text-text-muted">
                  {task.dueDate 
                    ? `Due ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`
                    : 'No due date'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={`text-xs px-2 py-1 ${getPriorityColor(task.priority)}`}
                >
                  {task.completed ? 'Done' : task.priority}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-destructive transition-all text-xs"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-xs text-text-muted hover:text-text-secondary"
          onClick={() => {/* Open chat with #task */}}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add new task (Ctrl+T)
        </Button>
      </div>
    </div>
  );
}
