import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackColor?: string;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SilkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Silk component error:', error, errorInfo);
  }

  private hexToNormalizedRGB = (hex: string): [number, number, number] => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return [r, g, b];
  };

  public render() {
    if (this.state.hasError) {
      const color = this.props.fallbackColor || "#7B7481";
      const [r, g, b] = this.hexToNormalizedRGB(color);
      const rgbColor = `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
      
      return (
        <div className={`relative ${this.props.className || ""}`}>
          <div 
            className="fixed inset-0 -z-10"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(${rgbColor}, 0.15) 0%, rgba(${rgbColor}, 0.05) 50%, transparent 100%), 
                          linear-gradient(45deg, rgba(${rgbColor}, 0.08) 0%, rgba(${rgbColor}, 0.03) 100%)`,
              animation: 'pulse 8s ease-in-out infinite alternate'
            }}
          />
          {/* Render children even when Silk fails */}
          <div className="relative z-10">
            {this.props.children}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SilkErrorBoundary;