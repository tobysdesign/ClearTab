import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Input } from '../components/ui/input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
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
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'search', 'url', 'tel'],
    },
    placeholder: {
      control: { type: 'text' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic input types
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email...',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number...',
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

// States
export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'This input has a value',
  },
};

export const LongPlaceholder: Story = {
  args: {
    placeholder: 'This is a very long placeholder text to see how it behaves',
  },
};

// Interactive examples
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = React.useState('');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '250px' }}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type something..."
        />
        <div style={{ fontSize: '12px', color: '#999' }}>
          Value: "{value}" (Length: {value.length})
        </div>
      </div>
    );
  },
};

// Form examples
export const LoginForm: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      email: '',
      password: '',
    });

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        minWidth: '300px',
        padding: '24px',
        background: '#1a1a1a',
        borderRadius: '8px',
      }}>
        <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>Login Form</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: 'white', fontSize: '14px' }}>Email</label>
          <Input
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: 'white', fontSize: '14px' }}>Password</label>
          <Input
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          />
        </div>
        <button
          style={{
            padding: '8px 16px',
            background: '#bb86fc',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '8px',
          }}
          onClick={() => alert(`Email: ${formData.email}, Password: ${formData.password}`)}
        >
          Sign In
        </button>
      </div>
    );
  },
};

export const SearchForm: Story = {
  render: () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [results, setResults] = React.useState<string[]>([]);

    const mockSearch = (term: string) => {
      if (!term) {
        setResults([]);
        return;
      }

      const mockResults = [
        'Task management',
        'Note taking',
        'Calendar integration',
        'Weather widget',
        'Dashboard customization',
        'Settings configuration',
        'Account management',
        'Data synchronization',
      ].filter(item =>
        item.toLowerCase().includes(term.toLowerCase())
      );

      setResults(mockResults);
    };

    React.useEffect(() => {
      const timeoutId = setTimeout(() => mockSearch(searchTerm), 300);
      return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: '300px',
      }}>
        <Input
          type="search"
          placeholder="Search features..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {results.length > 0 && (
          <div style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => {
                  setSearchTerm(result);
                  setResults([]);
                }}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
};

// Validation example
export const WithValidation: Story = {
  render: () => {
    const [email, setEmail] = React.useState('');
    const [touched, setTouched] = React.useState(false);

    const isValid = email.includes('@') && email.includes('.');
    const showError = touched && !isValid && email.length > 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '250px' }}>
        <label style={{ color: 'white', fontSize: '14px' }}>Email Address</label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          style={{
            borderColor: showError ? '#ef4444' : undefined,
          }}
        />
        {showError && (
          <span style={{ color: '#ef4444', fontSize: '12px' }}>
            Please enter a valid email address
          </span>
        )}
        {touched && isValid && (
          <span style={{ color: '#22c55e', fontSize: '12px' }}>
            Email looks good!
          </span>
        )}
      </div>
    );
  },
};

// Different sizes demonstration
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '250px' }}>
      <div>
        <label style={{ color: 'white', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
          Normal State
        </label>
        <Input placeholder="Normal input" />
      </div>

      <div>
        <label style={{ color: 'white', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
          With Value
        </label>
        <Input defaultValue="This input has content" />
      </div>

      <div>
        <label style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
          Disabled
        </label>
        <Input placeholder="Disabled input" disabled />
      </div>

      <div>
        <label style={{ color: 'white', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
          Error State
        </label>
        <Input
          placeholder="Input with error"
          style={{ borderColor: '#ef4444' }}
        />
      </div>

      <div>
        <label style={{ color: 'white', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
          Success State
        </label>
        <Input
          placeholder="Input with success"
          style={{ borderColor: '#22c55e' }}
        />
      </div>
    </div>
  ),
};