import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/button/button';
import { AddIcon, CheckIcon, MoreActionsIcon } from '../components/icons';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
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
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'ghost-icon', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    asChild: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default button variants
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const GhostIcon: Story = {
  args: {
    children: <MoreActionsIcon size={16} />,
    variant: 'ghost-icon',
    size: 'icon',
  },
};

export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link',
  },
};

// Size variants
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

export const Icon: Story = {
  args: {
    children: <AddIcon size={16} />,
    size: 'icon',
  },
};

// State variants
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const DisabledDestructive: Story = {
  args: {
    children: 'Disabled Delete',
    variant: 'destructive',
    disabled: true,
  },
};

// Interactive examples
export const WithClickHandler: Story = {
  args: {
    children: 'Click me',
    onClick: () => alert('Button clicked!'),
  },
};

// Layout examples showing multiple variants
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="ghost-icon" size="icon"><MoreActionsIcon size={16} /></Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><AddIcon size={16} /></Button>
    </div>
  ),
};

export const ButtonStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Button>Normal</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Button variant="destructive">Delete</Button>
        <Button variant="destructive" disabled>Disabled Delete</Button>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Button variant="outline">Cancel</Button>
        <Button variant="outline" disabled>Disabled Cancel</Button>
      </div>
    </div>
  ),
};

// Real-world usage examples
export const TaskFormButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button variant="default">Create Task</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  ),
};

export const SettingsActions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button variant="default">Save Changes</Button>
      <Button variant="secondary">Reset</Button>
      <Button variant="destructive">Delete Account</Button>
    </div>
  ),
};

// Icon-focused examples
export const IconButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button variant="ghost-icon" size="icon">
        <AddIcon size={16} />
      </Button>
      <Button variant="ghost-icon" size="icon">
        <CheckIcon size={16} />
      </Button>
      <Button variant="ghost-icon" size="icon">
        <MoreActionsIcon size={16} />
      </Button>
    </div>
  ),
};

export const IconWithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Button variant="default">
        <AddIcon size={16} />
        Add Task
      </Button>
      <Button variant="secondary">
        <CheckIcon size={16} />
        Mark Complete
      </Button>
      <Button variant="outline">
        <MoreActionsIcon size={16} />
        More Options
      </Button>
    </div>
  ),
};

export const IconButtonVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="default" size="icon">
        <AddIcon size={16} />
      </Button>
      <Button variant="secondary" size="icon">
        <AddIcon size={16} />
      </Button>
      <Button variant="outline" size="icon">
        <AddIcon size={16} />
      </Button>
      <Button variant="ghost" size="icon">
        <AddIcon size={16} />
      </Button>
      <Button variant="ghost-icon" size="icon">
        <AddIcon size={16} />
      </Button>
    </div>
  ),
};

export const WidgetActions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Button variant="ghost-icon" size="icon">
        <AddIcon size={16} />
      </Button>
      <Button variant="ghost-icon" size="icon">
        <MoreActionsIcon size={16} />
      </Button>
    </div>
  ),
};