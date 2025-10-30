import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Checkbox } from '../components/ui/checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
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
    checked: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic states
export const Unchecked: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    checked: false,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Checkbox
          checked={checked}
          onCheckedChange={setChecked}
        />
        <label style={{ color: 'white', cursor: 'pointer' }} onClick={() => setChecked(!checked)}>
          {checked ? 'Checked' : 'Unchecked'}
        </label>
      </div>
    );
  },
};

// With labels (real-world usage)
export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Checkbox id="terms" />
      <label htmlFor="terms" style={{ color: 'white', cursor: 'pointer' }}>
        I agree to the terms and conditions
      </label>
    </div>
  ),
};

export const TaskCompletion: Story = {
  render: () => {
    const [tasks, setTasks] = React.useState([
      { id: 1, text: 'Complete project proposal', completed: false },
      { id: 2, text: 'Review design mockups', completed: true },
      { id: 3, text: 'Schedule team meeting', completed: false },
    ]);

    const toggleTask = (id: number) => {
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '250px' }}>
        <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>Tasks</h3>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              background: '#1a1a1a',
              borderRadius: '6px',
            }}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
            />
            <span
              style={{
                color: task.completed ? '#999' : 'white',
                textDecoration: task.completed ? 'line-through' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => toggleTask(task.id)}
            >
              {task.text}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

// Settings/preferences example
export const SettingsPreferences: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      notifications: true,
      darkMode: false,
      autoSave: true,
      showTimestamps: false,
    });

    const updateSetting = (key: keyof typeof settings) => {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '200px' }}>
        <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>Preferences</h3>
        {Object.entries(settings).map(([key, value]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
            }}
          >
            <Checkbox
              checked={value}
              onCheckedChange={() => updateSetting(key as keyof typeof settings)}
            />
            <label
              style={{ color: 'white', cursor: 'pointer', textTransform: 'capitalize' }}
              onClick={() => updateSetting(key as keyof typeof settings)}
            >
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
          </div>
        ))}
      </div>
    );
  },
};

// All states demonstration
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Checkbox checked={false} />
        <span style={{ color: 'white' }}>Unchecked</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Checkbox checked={true} />
        <span style={{ color: 'white' }}>Checked</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Checkbox disabled checked={false} />
        <span style={{ color: '#666' }}>Disabled Unchecked</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Checkbox disabled checked={true} />
        <span style={{ color: '#666' }}>Disabled Checked</span>
      </div>
    </div>
  ),
};

// Form validation example
export const FormValidation: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      terms: false,
      newsletter: false,
      privacy: false,
    });
    const [submitted, setSubmitted] = React.useState(false);

    const isValid = formData.terms && formData.privacy;

    const handleSubmit = () => {
      setSubmitted(true);
      if (isValid) {
        alert('Form submitted successfully!');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '300px' }}>
        <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>Sign Up Form</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Checkbox
            checked={formData.terms}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms: !!checked }))}
          />
          <label style={{ color: 'white', cursor: 'pointer' }}>
            I agree to the terms and conditions *
          </label>
        </div>
        {submitted && !formData.terms && (
          <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '20px' }}>
            Required field
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Checkbox
            checked={formData.privacy}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, privacy: !!checked }))}
          />
          <label style={{ color: 'white', cursor: 'pointer' }}>
            I agree to the privacy policy *
          </label>
        </div>
        {submitted && !formData.privacy && (
          <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '20px' }}>
            Required field
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Checkbox
            checked={formData.newsletter}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, newsletter: !!checked }))}
          />
          <label style={{ color: 'white', cursor: 'pointer' }}>
            Subscribe to newsletter (optional)
          </label>
        </div>

        <button
          onClick={handleSubmit}
          style={{
            padding: '8px 16px',
            background: isValid ? '#bb86fc' : '#333',
            color: isValid ? 'black' : '#666',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid ? 'pointer' : 'not-allowed',
            marginTop: '8px',
          }}
        >
          Submit
        </button>
      </div>
    );
  },
};