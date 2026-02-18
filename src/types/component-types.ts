/**
 * Component architecture type definitions
 */

export interface ComponentLifecycle {
  onMount?(): void;
  onUpdate?(prevState: any): void;
  onDestroy?(): void;
}

export interface BaseComponentState {
  [key: string]: any;
}

// Alias for backward compatibility
export type ComponentState = BaseComponentState;

export interface ComponentEventHandler<T = Event> {
  (event: T): void;
}

export interface ViewportContext {
  width: number;
  height: number;
  breakpoint: BreakpointName;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isUltraWide: boolean;
  orientation: 'portrait' | 'landscape';
}

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide';

export interface ComponentEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

export interface RenderOptions {
  viewport: ViewportContext;
  theme: string;
}
