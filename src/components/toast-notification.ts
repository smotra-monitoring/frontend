/**
 * Toast notification component
 * Displays temporary notifications at bottom of screen (thumb-friendly on mobile)
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { SystemNotificationMessage } from '../types/websocket-types.js';

interface ToastState extends ComponentState {
  notifications: ToastNotificationData[];
}

interface ToastNotificationData {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  dismissible: boolean;
}

/**
 * Toast notification container
 */
export class ToastNotification extends BaseComponent<ToastState> {
  private static readonly AUTO_DISMISS_DELAY = 5000;
  private dismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  constructor(root: HTMLElement) {
    super(root, {
      notifications: [],
    });
    
    // Listen for system notifications from WebSocket
    this.addEventListener(window, 'system:notification', (e) => {
      const event = e as CustomEvent<SystemNotificationMessage>;
      this.show({
        message: event.detail.message,
        type: event.detail.severity,
        duration: ToastNotification.AUTO_DISMISS_DELAY,
        dismissible: true,
      });
    });
  }
  
  render(): void {
    const { notifications } = this.state;
    
    this.root.innerHTML = `
      <div class="toast-container ${this.isMobile() ? 'toast-container--mobile' : ''}" aria-live="polite">
        ${notifications.map(notification => this.renderToast(notification)).join('')}
      </div>
    `;
    
    // Attach event listeners
    this.attachEventListeners();
  }
  
  private renderToast(notification: ToastNotificationData): string {
    return `
      <div 
        class="toast toast--${notification.type}"
        data-toast-id="${notification.id}"
        role="alert"
      >
        <div class="toast__icon">
          ${this.getIcon(notification.type)}
        </div>
        <div class="toast__content">
          <p class="toast__message">${this.escapeHtml(notification.message)}</p>
        </div>
        ${notification.dismissible ? `
          <button 
            class="toast__dismiss button is-ghost is-small"
            data-action="dismiss"
            aria-label="Dismiss notification"
          >
            <span class="icon is-small">
              <i class="fas fa-times"></i>
            </span>
          </button>
        ` : ''}
      </div>
    `;
  }
  
  private attachEventListeners(): void {
    // Dismiss buttons
    this.queryAll('[data-action="dismiss"]').forEach(button => {
      this.addEventListener(button, 'click', (e) => {
        const toastElement = (e.target as HTMLElement).closest('[data-toast-id]') as HTMLElement;
        
        if (toastElement) {
          const toastId = toastElement.dataset.toastId!;
          this.dismiss(toastId);
        }
      });
    });
  }
  
  private getIcon(type: ToastNotificationData['type']): string {
    switch (type) {
      case 'success':
        return '<i class="fas fa-check-circle"></i>';
      case 'warning':
        return '<i class="fas fa-exclamation-triangle"></i>';
      case 'error':
        return '<i class="fas fa-times-circle"></i>';
      case 'info':
      default:
        return '<i class="fas fa-info-circle"></i>';
    }
  }
  
  /**
   * Show a toast notification
   */
  show(options: Omit<ToastNotificationData, 'id'>): string {
    const id = this.generateId();
    
    const notification: ToastNotificationData = {
      id,
      ...options,
    };
    
    // Add to state
    this.setState({
      notifications: [...this.state.notifications, notification],
    });
    
    // Auto-dismiss if duration specified
    if (notification.duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
      
      this.dismissTimers.set(id, timer);
    }
    
    return id;
  }
  
  /**
   * Dismiss a specific notification
   */
  dismiss(id: string): void {
    // Clear dismiss timer
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
    
    // Add exit animation class
    const toastElement = this.query(`[data-toast-id="${id}"]`);
    if (toastElement) {
      toastElement.classList.add('toast--exiting');
      
      // Remove after animation completes
      setTimeout(() => {
        this.setState({
          notifications: this.state.notifications.filter(n => n.id !== id),
        });
      }, 300);
    } else {
      this.setState({
        notifications: this.state.notifications.filter(n => n.id !== id),
      });
    }
  }
  
  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    // Clear all timers
    this.dismissTimers.forEach(timer => clearTimeout(timer));
    this.dismissTimers.clear();
    
    this.setState({ notifications: [] });
  }
  
  /**
   * Convenience methods for different notification types
   */
  success(message: string, duration = ToastNotification.AUTO_DISMISS_DELAY): string {
    return this.show({ message, type: 'success', duration, dismissible: true });
  }
  
  error(message: string, duration = 0): string {
    // Errors don't auto-dismiss by default
    return this.show({ message, type: 'error', duration, dismissible: true });
  }
  
  warning(message: string, duration = ToastNotification.AUTO_DISMISS_DELAY): string {
    return this.show({ message, type: 'warning', duration, dismissible: true });
  }
  
  info(message: string, duration = ToastNotification.AUTO_DISMISS_DELAY): string {
    return this.show({ message, type: 'info', duration, dismissible: true });
  }
  
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  onDestroy(): void {
    // Clear all dismiss timers
    this.dismissTimers.forEach(timer => clearTimeout(timer));
    this.dismissTimers.clear();
  }
}
