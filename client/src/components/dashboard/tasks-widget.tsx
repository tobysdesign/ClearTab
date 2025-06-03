import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChatContext } from "@/hooks/use-chat-context";
import type { Task } from "@shared/schema";
import { format } from "date-fns";

export default function TasksWidget() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  
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

  const handleToggleTask = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({ id, data: { completed } });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="widget tasks-widget h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">#Tasks</h3>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-2 rounded animate-pulse">
                <div className="w-4 h-4 bg-muted rounded mt-0.5"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded mb-2"></div>
                  <div className="h-2 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            <Plus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs mt-1">Click below to add your first task</p>
          </div>
        ) : (
          <div className="pl-0 pr-2">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className="flex items-start space-x-2 p-2 rounded mb-1"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                  className="mt-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button 
                            className={`text-left text-xs font-medium hover:text-primary transition-colors cursor-pointer leading-tight ${
                              task.completed ? 'line-through text-muted-foreground' : 'text-text-primary'
                            }`}
                          >
                            {task.title}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" side="right" align="start">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority} priority
                              </Badge>
                              {task.completed && (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            {task.dueDate && (
                              <div className="text-xs text-muted-foreground">
                                Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-start ml-2">
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground leading-tight">
                          {format(new Date(task.dueDate), 'M/d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-3 border-t border-border">
        <button 
          className="text-xs text-text-muted text-center w-full hover:text-text-secondary transition-colors"
          onClick={() => openChatWithPrompt("Create a new task for me")}
        >
          Add new task
        </button>
      </div>
    </div>
  );
}