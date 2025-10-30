import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { FormButtons } from '../components/ui/form-buttons';

const meta: Meta<typeof FormButtons> = {
  title: 'UI/FormButtons',
  component: FormButtons,
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
    mode: {
      control: { type: 'select' },
      options: ['create', 'edit'],
    },
    primaryText: {
      control: { type: 'text' },
    },
    secondaryText: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Create mode (shows both primary and secondary buttons)
export const CreateMode: Story = {
  args: {
    mode: 'create',
    onPrimary: () => console.log('Primary action clicked'),
    onSecondary: () => console.log('Secondary action clicked'),
  },
};

export const CreateModeCustomText: Story = {
  args: {
    mode: 'create',
    primaryText: 'Save Draft',
    secondaryText: 'Discard',
    onPrimary: () => console.log('Save draft clicked'),
    onSecondary: () => console.log('Discard clicked'),
  },
};

// Edit mode (shows only primary button)
export const EditMode: Story = {
  args: {
    mode: 'edit',
    onPrimary: () => console.log('Done clicked'),
  },
};

export const EditModeCustomText: Story = {
  args: {
    mode: 'edit',
    primaryText: 'Save Changes',
    onPrimary: () => console.log('Save changes clicked'),
  },
};

// Real-world usage examples
export const TaskCreation: Story = {
  args: {
    mode: 'create',
    primaryText: 'Create Task',
    secondaryText: 'Cancel',
    onPrimary: () => alert('Task created!'),
    onSecondary: () => alert('Task creation cancelled'),
  },
};

export const TaskEditing: Story = {
  args: {
    mode: 'edit',
    primaryText: 'Done',
    onPrimary: () => alert('Task saved!'),
  },
};

export const NoteCreation: Story = {
  args: {
    mode: 'create',
    primaryText: 'Save Note',
    secondaryText: 'Cancel',
    onPrimary: () => alert('Note saved!'),
    onSecondary: () => alert('Note creation cancelled'),
  },
};

export const SettingsForm: Story = {
  args: {
    mode: 'create',
    primaryText: 'Apply Settings',
    secondaryText: 'Reset to Default',
    onPrimary: () => alert('Settings applied!'),
    onSecondary: () => alert('Settings reset to default'),
  },
};

// Layout demonstration
export const BothModes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px' }}>Create Mode</h3>
        <FormButtons
          mode="create"
          primaryText="Create Item"
          secondaryText="Cancel"
          onPrimary={() => console.log('Create clicked')}
          onSecondary={() => console.log('Cancel clicked')}
        />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px' }}>Edit Mode</h3>
        <FormButtons
          mode="edit"
          primaryText="Save Changes"
          onPrimary={() => console.log('Save clicked')}
        />
      </div>
    </div>
  ),
};

// Interactive example
export const InteractiveExample: Story = {
  render: () => {
    const [mode, setMode] = React.useState<'create' | 'edit'>('create');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMode('create')}
            style={{
              padding: '4px 8px',
              background: mode === 'create' ? '#bb86fc' : 'transparent',
              color: 'white',
              border: '1px solid #bb86fc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Create Mode
          </button>
          <button
            onClick={() => setMode('edit')}
            style={{
              padding: '4px 8px',
              background: mode === 'edit' ? '#bb86fc' : 'transparent',
              color: 'white',
              border: '1px solid #bb86fc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Edit Mode
          </button>
        </div>
        <FormButtons
          mode={mode}
          onPrimary={() => alert(`${mode === 'create' ? 'Created' : 'Saved'}!`)}
          onSecondary={() => alert('Cancelled!')}
        />
      </div>
    );
  },
};