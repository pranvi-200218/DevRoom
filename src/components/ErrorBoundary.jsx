import { Component } from "react";
import { mi } from "../lib/icons";

/**
 * Generic error boundary. Without one, an uncaught render/render-effect
 * error anywhere below it unmounts the entire React tree — since this app's
 * theme is dark, that shows up as a plain black page with nothing on it
 * (no white "something went wrong" screen, just... nothing).
 *
 * Usage:
 *   <ErrorBoundary fallback="inline">      -> small inline pill, good for
 *                                             widgets like NotificationBell
 *   <ErrorBoundary>                        -> full-panel message, good for
 *                                             wrapping an entire page/route
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback === "inline") {
      return (
        <button
          onClick={this.reset}
          title="Something went wrong loading this — click to retry"
          className="w-9 h-9 flex items-center justify-center rounded-full text-error/70 hover:text-error hover:bg-error/10 transition-colors"
        >
          <i className={`${mi("error")} text-[20px]`} />
        </button>
      );
    }

    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <i className={`${mi("error")} text-error text-[36px]`} />
        <p className="text-on-surface font-medium">Something went wrong.</p>
        <p className="text-on-surface-variant text-sm max-w-sm">
          This part of the page hit an error. You can try again, or reload the page.
        </p>
        <button
          onClick={this.reset}
          className="mt-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 active:scale-95 transition-all"
        >
          Try again
        </button>
      </div>
    );
  }
}