/**
 * Component architecture type definitions
 */

export interface ComponentLifecycle {
  onMount?(): void;
  onUpdate?(prevState: any): void;
  onDestroy?(): void;
}

export interface ComponentState {
  [key: string]: any;
}

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide';

export interface ComponentEvent {
  type: string;
  payload?: any;
  timestamp: number;
}
