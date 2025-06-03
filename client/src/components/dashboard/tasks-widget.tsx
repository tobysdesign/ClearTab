import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckSquare, Plus, Edit3, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChatContext } from "@/hooks/use-chat-context";
import type { Task } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";

export default function TasksWidget() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  
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

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate
    });
  };

  const handleSaveEdit = () => {
    if (editingTaskId) {
      updateTaskMutation.mutate({ id: editingTaskId, data: editForm });
      setEditingTaskId(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditForm({});
  };

  const formatCompactDate = (dateString: string | null) => {
    if (!dateString) return null;
    return format(new Date(dateString), 'M/d');
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
        <h2 className="text-sm font-medium text-muted-foreground">#Tasks</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs text-text-muted bg-muted">
            Ctrl+T
          </Badge>
          <CheckSquare className="h-5 w-5 text-text-secondary" />
        </div>
      </div>
      
      <div className="flex-1 space-y-1 overflow-y-auto max-h-[400px]">
        {isLoading ? (
          <div className="space-y-1 p-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 rounded animate-pulse">
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
          <div className="p-1">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={`relative transition-all duration-300 ease-out ${
                  editingTaskId === task.id 
                    ? 'mb-4 transform scale-105 z-10' 
                    : 'mb-1'
                }`}
              >
                {editingTaskId === task.id ? (
                  <Card className="p-4 border-2 border-primary/20 shadow-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Edit Task</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        placeholder="Task title"
                        className="text-sm"
                      />
                      <Textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Description (optional)"
                        rows={2}
                        className="text-xs resize-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={editForm.priority || 'medium'}
                          onValueChange={(value) => setEditForm({...editForm, priority: value})}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={editForm.dueDate || ''}
                          onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer group">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                    />
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${task.completed ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatCompactDate(task.dueDate)}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTask(task);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="p-2">
              <button
                onClick={() => openChatWithPrompt("Create a new task for me")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Add new task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
