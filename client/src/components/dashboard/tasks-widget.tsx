import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatContext } from "@/hooks/use-chat-context";
import type { Task } from "@shared/schema";
import { format } from "date-fns";

export default function TasksWidget() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  
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

  const deleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const getPriorityColor = (priority: string) => {
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Card className="bg-card text-card-foreground border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">
          Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {isLoading ? (
            <div className="space-y-2 p-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3 p-2 rounded animate-pulse">
                  <div className="w-4 h-4 bg-muted rounded mt-0.5"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-2 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  ref={(el) => { taskRefs.current[task.id] = el; }}
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => toggleTaskStatus.mutate({ id: task.id, completed: checked as boolean })}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm mb-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40" align="end">
                      <div className="space-y-1">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                        >
                          Edit Task
                        </button>
                        <button
                          onClick={() => updateTaskPriority.mutate({ id: task.id, priority: 'high' })}
                          className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                        >
                          Mark High Priority
                        </button>
                        <button
                          onClick={() => updateTaskPriority.mutate({ id: task.id, priority: 'medium' })}
                          className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                        >
                          Mark Medium Priority
                        </button>
                        <button
                          onClick={() => updateTaskPriority.mutate({ id: task.id, priority: 'low' })}
                          className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                        >
                          Mark Low Priority
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded text-destructive"
                        >
                          Delete Task
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-3 border-t border-border/50">
          <button 
            className="text-xs text-text-muted text-left w-full hover:text-text-secondary transition-colors"
            onClick={() => openChatWithPrompt("Create a new task for me")}
          >
            Add new task
          </button>
        </div>
      </CardContent>
      
      <TaskEditModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        triggerRef={editingTask ? { current: taskRefs.current[editingTask.id] } : undefined}
      />
    </Card>
  );
}