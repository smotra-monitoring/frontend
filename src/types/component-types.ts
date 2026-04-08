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
