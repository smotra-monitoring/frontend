/**
 * Lightweight global state management with pub/sub pattern
 * No frameworks needed - vanilla TypeScript implementation
 */

type Subscriber<T> = (state: T) => void;
type UnsubscribeFn = () => void;

export class GlobalState<T = any> {
  private state: T;
  private subscribers: Set<Subscriber<T>> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * Get current state
   */
  getState(): T {
    return this.state;
  }

  /**
   * Update state and notify subscribers
   */
  setState(updater: Partial<T> | ((prevState: T) => T)): void {
    const prevState = this.state;

    if (typeof updater === 'function') {
      this.state = updater(prevState);
    } else {
      this.state = { ...prevState, ...updater };
    }

    this.notify();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(subscriber: Subscriber<T>): UnsubscribeFn {
    this.subscribers.add(subscriber);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notify(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  /**
   * Reset state to initial value
   */
  reset(initialState: T): void {
    this.state = initialState;
    this.notify();
  }

  /**
   * Get number of active subscribers
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * Clear all subscribers
   */
  clearSubscribers(): void {
    this.subscribers.clear();
  }
}

/**
 * Create a new global state instance
 */
export function createState<T>(initialState: T): GlobalState<T> {
  return new GlobalState(initialState);
}
