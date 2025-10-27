import type { Meta, StoryObj } from '@storybook/react';
import { AddButton } from '../components/ui/add-button';

const meta: Meta<typeof AddButton> = {
  title: 'UI/AddButton',
  component: AddButton,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tooltip: 'Add new item',
  },
};

export const WithoutTooltip: Story = {
  args: {},
};

export const CustomContent: Story = {
  args: {
    children: '⭐',
  },
};