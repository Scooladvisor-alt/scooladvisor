import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Redirect to home instantly as requested
    if (window.location.pathname !== "/") {
        window.location.href = "/";
    }
  }

  render() {
    if (this.state.hasError) {
      // Render nothing or a loader while redirecting
      return <div className="min-h-screen bg-white" />; 
    }

    return this.props.children;
  }
}