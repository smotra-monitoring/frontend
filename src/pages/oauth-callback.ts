/**
 * OAuth callback page
 * Handles OAuth redirect and completes authentication
 */

import { BaseComponent } from '../components/base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { handleLoginCallback } from '../services/auth-service.js';
import { getRedirectAfterLogin } from '../auth/auth-guard.js';

interface OAuthCallbackPageState extends ComponentState {
  status: 'processing' | 'success' | 'error';
  message: string;
}

/**
 * OAuth callback handler page
 */
export class OAuthCallbackPage extends BaseComponent<OAuthCallbackPageState> {
  constructor(root: HTMLElement) {
    super(root, {
      status: 'processing',
      message: 'Completing authentication...',
    });
  }

  render(): void {
    const { status, message } = this.state;

    this.root.innerHTML = `
      <div class="oauth-callback">
        <div class="oauth-callback__card">
          <div class="oauth-callback__icon oauth-callback__icon--${status}">
            ${this.getStatusIcon(status)}
          </div>
          
          <h1 class="oauth-callback__title">${this.getStatusTitle(status)}</h1>
          
          <p class="oauth-callback__message">${this.escapeHtml(message)}</p>
          
          ${status === 'processing' ? `
            <div class="oauth-callback__spinner">
              <div class="loading-spinner"></div>
            </div>
          ` : ''}
          
          ${status === 'error' ? `
            <div class="oauth-callback__actions">
              <a href="/login" class="button is-primary">
                <span class="icon">
                  <i class="fas fa-arrow-left"></i>
                </span>
                <span>Back to Login</span>
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private getStatusIcon(status: OAuthCallbackPageState['status']): string {
    switch (status) {
      case 'processing':
        return '<i class="fas fa-spinner fa-spin"></i>';
      case 'success':
        return '<i class="fas fa-check-circle"></i>';
      case 'error':
        return '<i class="fas fa-times-circle"></i>';
    }
  }

  private getStatusTitle(status: OAuthCallbackPageState['status']): string {
    switch (status) {
      case 'processing':
        return 'Authenticating...';
      case 'success':
        return 'Authentication Successful';
      case 'error':
        return 'Authentication Failed';
    }
  }

  async onMount(): Promise<void> {
    // Process OAuth callback
    await this.processCallback();
  }

  private async processCallback(): Promise<void> {
    try {
      // Handle login callback
      const [success, errorMessage] = await handleLoginCallback();

      if (success) {
        this.setState({
          status: 'success',
          message: 'Redirecting to dashboard...',
        });

        // Redirect to original destination or dashboard
        const redirectUrl = getRedirectAfterLogin() || '/dashboard';

        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        this.setState({
          status: 'error',
          message: errorMessage || 'Authentication failed. Please try again.',
        });
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      this.setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
