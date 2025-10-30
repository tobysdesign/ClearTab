import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f0f10',
        },
        {
          name: 'material-dark',
          value: '#121212',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: {
        base: 'dark',
        colorPrimary: '#bb86fc',
        colorSecondary: '#03dac6',

        // UI
        appBg: '#0f0f10',
        appContentBg: '#121212',
        appBorderColor: '#3d3d3d',
        appBorderRadius: 8,

        // Text colors
        textColor: '#e6e6e6',
        textInverseColor: '#121212',

        // Toolbar default and active colors
        barTextColor: '#e6e6e6',
        barSelectedColor: '#bb86fc',
        barBg: '#1a1a1a',

        // Form colors
        inputBg: '#1a1a1a',
        inputBorder: '#3d3d3d',
        inputTextColor: '#e6e6e6',
        inputBorderRadius: 8,
      },
    },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Material Design Theme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'dark';

      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: theme === 'dark' ? '#0f0f10' : '#ffffff',
            color: theme === 'dark' ? '#e6e6e6' : '#121212',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '2rem',
          }}
          data-theme={theme}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;