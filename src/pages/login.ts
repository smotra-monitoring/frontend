/**
 * Login page
 * OAuth provider selection
 */

import { BaseComponent } from '../components/base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { OAuth2Provider } from '../types/auth-types.js';
import { login } from '../services/auth-service.js';
import { isAuthenticated } from '../state/auth-state.js';

interface LoginPageState extends ComponentState {
  loading: boolean;
  error: string | null;
}

interface OAuthProviderOption {
  id: OAuth2Provider;
  name: string;
  icon: string;
  color: string;
}

/**
 * Login page with OAuth provider selection
 */
export class LoginPage extends BaseComponent<LoginPageState> {
  private providers: OAuthProviderOption[] = [
    { id: 'okta', name: 'Okta', icon: 'fas fa-shield-alt', color: '#007dc1' },
    { id: 'auth0', name: 'Auth0', icon: 'fas fa-lock', color: '#eb5424' },
    { id: 'azure', name: 'Azure AD', icon: 'fab fa-microsoft', color: '#0078d4' },
    { id: 'google', name: 'Google', icon: 'fab fa-google', color: '#4285f4' },
    { id: 'oidc', name: 'OpenID Connect', icon: 'fas fa-id-card', color: '#666' },
  ];

  constructor(root: HTMLElement) {
    super(root, {
      loading: false,
      error: null,
    });
  }

  render(): void {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated()) {
      console.error('This code is unreachable, if you see this message, something went wrong with authentication check. Please reach out to support.');
      window.location.href = '/dashboard';
      return;
    }

    const { loading, error } = this.state;

    this.root.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-card__header">
            <h1 class="login-card__title"><i class="fas fa-chart-line"></i> Smotra</h1>
            <p class="login-card__subtitle">Distributed Monitoring System</p>
          </div>
          
          ${error ? `
            <div class="notification is-danger is-light">
              <button class="delete" data-action="clear-error"></button>
              ${this.escapeHtml(error)}
            </div>
          ` : ''}
          
          <div class="login-card__body">
            <h2 class="login-card__prompt">Sign in to continue</h2>
            
            <div class="login-providers ${this.isMobile() ? 'login-providers--mobile' : ''}">
              ${this.providers.map(provider => this.renderProvider(provider, loading)).join('')}
            </div>
          </div>
          
          <div class="login-card__footer">
            <p class="has-text-grey has-text-centered">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderProvider(provider: OAuthProviderOption, loading: boolean): string {
    return `
      <button 
        class="login-provider"
        data-provider="${provider.id}"
        ${loading ? 'disabled' : ''}
        aria-label="Sign in with ${provider.name}"
      >
        <span class="login-provider__icon" style="color: ${provider.color};">
          <i class="${provider.icon}"></i>
        </span>
        <span class="login-provider__name">${provider.name}</span>
        <span class="icon">
          <i class="fas fa-arrow-right"></i>
        </span>
      </button>
    `;
  }

  private attachEventListeners(): void {
    // Provider buttons
    this.queryAll('.login-provider').forEach(button => {
      this.addEventListener(button, 'click', async (e) => {
        const provider = (button as HTMLElement).dataset.provider as OAuth2Provider;
        await this.handleLogin(provider);
      });
    });

    // Clear error button
    const clearErrorButton = this.query('[data-action="clear-error"]');
    if (clearErrorButton) {
      this.addEventListener(clearErrorButton, 'click', () => {
        this.setState({ error: null });
      });
    }
  }

  private async handleLogin(provider: OAuth2Provider): Promise<void> {
    this.setState({ loading: true, error: null });

    try {
      await login(provider);
      // login() redirects to OAuth provider, so we won't reach here
    } catch (error) {
      console.error('Login error:', error);
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed. Please try again.',
      });
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
