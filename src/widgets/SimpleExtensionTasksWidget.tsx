"use client";

import React, { useState, useCallback } from "react";
import { AddButton } from "@/components/ui/add-button";
import { WidgetHeader } from "@/components/ui/widget-header";
import { WidgetContainer } from "@/components/ui/widget-container";
import { WidgetLoader } from "@/components/widgets/widget-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { useExtensionStorage } from "../hooks/use-extension-storage";

interface SimpleTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export function SimpleExtensionTasksWidget() {
  const { data: tasks, setData: setTasks, loading: isLoading } = useExtensionStorage<SimpleTask[]>('tasks', []);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;

    const newTask: SimpleTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    setNewTaskTitle("");
  }, [tasks, setTasks, newTaskTitle]);

  const handleToggleTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
        : task
    );
    setTasks(updatedTasks);
  }, [tasks, setTasks]);

  const handleDeleteTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  }, [tasks, setTasks]);

  if (isLoading) {
    return <WidgetLoader />;
  }

  return (
    <WidgetContainer data-widget="tasks">
      <WidgetHeader title="Tasks">
        <AddButton onClick={handleCreateTask} />
      </WidgetHeader>

      <div style={{ padding: '16px' }}>
        {/* Add new task */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
            placeholder="Add a new task..."
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              background: '#222',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
            }}
          />
        </div>

        {/* Tasks list */}
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {tasks.length === 0 ? (
            <EmptyState
              title="No Tasks"
              description="Add your first task to get started."
            />
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  border: '1px solid #555',
                  backgroundColor: task.completed ? '#1a4a1a' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  style={{ marginRight: '12px' }}
                />
                <span
                  style={{
                    flex: 1,
                    color: task.completed ? '#888' : '#fff',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f44336',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginLeft: '8px',
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}