import { Component, ReactNode } from "react";
import { SwordFallback } from "./sword-fallback";

interface Props {
  children: ReactNode;
  flightMode: string;
}

interface State {
  hasError: boolean;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <SwordFallback flightMode={this.props.flightMode} />;
    }
    return this.props.children;
  }
}
