/**
 * Base component class
 * Provides lifecycle hooks, state management, and event handling
 */

import type { ComponentLifecycle, ComponentState } from '../types/component-types.js';
import type { ViewportBreakpoint, ViewportState } from '../types/viewport-types.js';
import { getCurrentBreakpoint } from '../utils/viewport-utils.js';
import { subscribeToViewportChanges } from '../state/viewport-state.js';

/**
 * Abstract base component class
 * All UI components should extend this class
 */
export abstract class BaseComponent<TState extends ComponentState = ComponentState> 
  implements ComponentLifecycle {
  
  protected root: HTMLElement;
  protected state: TState;
  protected mounted: boolean = false;
  protected destroyed: boolean = false;
  
  // Event listeners for cleanup
  private eventListeners: Array<{
    element: Element | Window;
    event: string;
    handler: EventListener;
  }> = [];
  
  // Subscriptions for cleanup
  private subscriptions: Array<() => void> = [];
  
  // Current viewport breakpoint
  protected viewport: ViewportBreakpoint = getCurrentBreakpoint();
  
  constructor(root: HTMLElement, initialState: TState) {
    this.root = root;
    this.state = initialState;
    
    // Subscribe to viewport changes for responsive rendering
    this.subscriptions.push(
      subscribeToViewportChanges((viewport: ViewportState) => {
        const prevViewport = this.viewport;
        this.viewport = viewport.breakpoint;
        
        // Trigger responsive update if breakpoint changed
        if (prevViewport !== viewport.breakpoint) {
          this.onViewportChange?.(prevViewport, viewport.breakpoint);
        }
      })
    );
  }
  
  /**
   * Abstract render method
   * Must be implemented by derived classes
   */
  abstract render(): void;
  
  /**
   * Lifecycle: Component mounted to DOM
   * Override to add initialization logic
   */
  onMount?(): void;
  
  /**
   * Lifecycle: State updated
   * Override to respond to state changes
   */
  onUpdate?(prevState: TState): void;
  
  /**
   * Lifecycle: Component being destroyed
   * Override to add cleanup logic
   */
  onDestroy?(): void;
  
  /**
   * Lifecycle: Viewport breakpoint changed
   * Override to handle responsive changes
   */
  onViewportChange?(prevBreakpoint: ViewportBreakpoint, newBreakpoint: ViewportBreakpoint): void;
  
  /**
   * Mount component to DOM
   */
  mount(): void {
    if (this.mounted || this.destroyed) {
      return;
    }
    
    this.mounted = true;
    this.render();
    this.onMount?.();
  }
  
  /**
   * Update component state
   */
  setState(newState: Partial<TState>): void {
    if (this.destroyed) {
      console.warn('Cannot update state of destroyed component');
      return;
    }
    
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // Re-render if mounted
    if (this.mounted) {
      this.render();
      this.onUpdate?.(prevState);
    }
  }
  
  /**
   * Get current state
   */
  getState(): TState {
    return this.state;
  }
  
  /**
   * Destroy component and cleanup
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    
    this.destroyed = true;
    
    // Call lifecycle hook
    this.onDestroy?.();
    
    // Remove all event listeners
    this.removeAllEventListeners();
    
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
    
    // Clear root element
    this.root.innerHTML = '';
    
    this.mounted = false;
  }
  
  /**
   * Add event listener with automatic cleanup
   */
  protected addEventListener<K extends keyof HTMLElementEventMap>(
    element: Element | Window,
    event: K | string,
    handler: EventListener
  ): void {
    if (this.destroyed) {
      return;
    }
    
    this.eventListeners.push({ element, event, handler });
    element.addEventListener(event, handler);
  }
  
  /**
   * Remove specific event listener
   */
  protected removeEventListener<K extends keyof HTMLElementEventMap>(
    element: Element | Window,
    event: K | string,
    handler: EventListener
  ): void {
    const index = this.eventListeners.findIndex(
      listener => listener.element === element && 
                  listener.event === event && 
                  listener.handler === handler
    );
    
    if (index !== -1) {
      this.eventListeners.splice(index, 1);
      element.removeEventListener(event, handler);
    }
  }
  
  /**
   * Remove all event listeners
   */
  private removeAllEventListeners(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
  
  /**
   * Add subscription with automatic cleanup
   */
  protected addSubscription(unsubscribe: () => void): void {
    if (!this.destroyed) {
      this.subscriptions.push(unsubscribe);
    }
  }
  
  /**
   * Query element within component root
   */
  protected query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return this.root.querySelector(selector);
  }
  
  /**
   * Query all elements within component root
   */
  protected queryAll<T extends HTMLElement = HTMLElement>(selector: string): T[] {
    return Array.from(this.root.querySelectorAll(selector));
  }
  
  /**
   * Check if component is mounted
   */
  isMounted(): boolean {
    return this.mounted;
  }
  
  /**
   * Check if component is destroyed
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }
  
  /**
   * Get current viewport breakpoint
   */
  protected getViewport(): ViewportBreakpoint {
    return this.viewport;
  }
  
  /**
   * Check if currently in mobile viewport
   */
  protected isMobile(): boolean {
    return this.viewport === 'mobile';
  }
  
  /**
   * Check if currently in tablet viewport
   */
  protected isTablet(): boolean {
    return this.viewport === 'tablet';
  }
  
  /**
   * Check if currently in desktop viewport or larger
   */
  protected isDesktop(): boolean {
    return ['desktop', 'wide', 'ultrawide'].includes(this.viewport);
  }
}
