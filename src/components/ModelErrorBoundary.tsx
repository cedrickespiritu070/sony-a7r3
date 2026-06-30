"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ModelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the actual error so we can see it in the dev console
    console.error("[ModelErrorBoundary] 3D model failed to load:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // CSS-only fallback — no second WebGL canvas that could conflict
      return this.props.fallback ?? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p style={{ color: "var(--fg-dim)", fontSize: "0.6rem", letterSpacing: "0.2em" }}>
            {this.state.message || "3D model unavailable"}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
