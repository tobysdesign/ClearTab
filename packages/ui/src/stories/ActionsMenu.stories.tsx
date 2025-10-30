import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ActionsMenu } from '../components/ui/actions-menu';

const meta: Meta<typeof ActionsMenu> = {
  title: 'UI/ActionsMenu',
  component: ActionsMenu,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f10' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  argTypes: {
    isNewNote: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state
export const Default: Story = {
  args: {
    onDelete: () => alert('Item deleted!'),
    isNewNote: false,
  },
};

// Disabled state (for new/unsaved items)
export const DisabledForNewItem: Story = {
  args: {
    onDelete: () => alert('This should not fire for new items'),
    isNewNote: true,
  },
};

// With custom delete handler
export const WithConfirmation: Story = {
  args: {
    onDelete: () => {
      if (window.confirm('Are you sure you want to delete this item?')) {
        alert('Item deleted!');
      }
    },
    isNewNote: false,
  },
};

// Usage in different contexts
export const TaskContextMenu: Story = {
  args: {
    onDelete: () => {
      console.log('Deleting task...');
      alert('Task deleted!');
    },
    isNewNote: false,
  },
  render: (args) => (
    <div style={{
      padding: '16px',
      background: '#1a1a1a',
      borderRadius: '8px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      minWidth: '200px'
    }}>
      <span>Complete project proposal</span>
      <ActionsMenu {...args} />
    </div>
  ),
};

export const NoteContextMenu: Story = {
  args: {
    onDelete: () => {
      console.log('Deleting note...');
      alert('Note deleted!');
    },
    isNewNote: false,
  },
  render: (args) => (
    <div style={{
      padding: '16px',
      background: '#1a1a1a',
      borderRadius: '8px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      minWidth: '200px'
    }}>
      <span>Meeting notes from today</span>
      <ActionsMenu {...args} />
    </div>
  ),
};

export const NewItemContextMenu: Story = {
  args: {
    onDelete: () => alert('Cannot delete unsaved item'),
    isNewNote: true,
  },
  render: (args) => (
    <div style={{
      padding: '16px',
      background: '#1a1a1a',
      borderRadius: '8px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      minWidth: '200px'
    }}>
      <span style={{ fontStyle: 'italic', opacity: 0.7 }}>New unsaved item</span>
      <ActionsMenu {...args} />
    </div>
  ),
};

// Multiple items demonstration
export const MultipleItems: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: '300px'
    }}>
      {[
        { id: 1, text: 'Saved task', isNew: false },
        { id: 2, text: 'Another saved task', isNew: false },
        { id: 3, text: 'New unsaved task', isNew: true },
      ].map((item) => (
        <div
          key={item.id}
          style={{
            padding: '12px',
            background: '#1a1a1a',
            borderRadius: '6px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{
            fontStyle: item.isNew ? 'italic' : 'normal',
            opacity: item.isNew ? 0.7 : 1
          }}>
            {item.text}
          </span>
          <ActionsMenu
            onDelete={() => alert(`Deleted: ${item.text}`)}
            isNewNote={item.isNew}
          />
        </div>
      ))}
    </div>
  ),
};

// Interactive example with state
export const InteractiveExample: Story = {
  render: () => {
    const [items, setItems] = React.useState([
      { id: 1, text: 'Task 1', saved: true },
      { id: 2, text: 'Task 2', saved: true },
      { id: 3, text: 'Unsaved task', saved: false },
    ]);

    const deleteItem = (id: number) => {
      setItems(items.filter(item => item.id !== id));
    };

    const addItem = () => {
      const newId = Math.max(...items.map(i => i.id)) + 1;
      setItems([...items, { id: newId, text: `New task ${newId}`, saved: false }]);
    };

    return (
      <div style={{ minWidth: '300px' }}>
        <div style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ color: 'white', margin: 0 }}>Interactive Items</h3>
          <button
            onClick={addItem}
            style={{
              padding: '4px 8px',
              background: '#bb86fc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Item
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '12px',
                background: '#1a1a1a',
                borderRadius: '6px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{
                fontStyle: !item.saved ? 'italic' : 'normal',
                opacity: !item.saved ? 0.7 : 1
              }}>
                {item.text} {!item.saved && '(unsaved)'}
              </span>
              <ActionsMenu
                onDelete={() => deleteItem(item.id)}
                isNewNote={!item.saved}
              />
            </div>
          ))}
          {items.length === 0 && (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666',
              fontStyle: 'italic'
            }}>
              No items. Click "Add Item" to create one.
            </div>
          )}
        </div>
      </div>
    );
  },
};