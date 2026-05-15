/**
 * Application entry point
 * Bootstrap and initialize the application
 */

import { initializeTheme } from './state/theme-manager.js';
import { initializeViewport } from './state/viewport-state.js';
import { initializeAuthService } from './services/auth-service.js';
import { loadAuthState } from './state/auth-state.js';
import { initializeRouter } from './pages/router.js';
import { client } from './api/client.gen.js';
import { getEnvironmentConfig } from './config.js';

/**
 * Bootstrap application
 */
async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 Bootstrapping Smotra...');

    // 0. Configure API client base URL (before anything else uses it)
    client.setConfig({ baseUrl: getEnvironmentConfig().apiBaseUrl });

    // 1. Initialize theme FIRST (prevent FOUC)
    // This ensures correct theme is applied before rendering
    initializeTheme();
    console.log('✓ Theme initialized');

    // 2. Initialize viewport tracking
    // Monitors window size for responsive rendering
    initializeViewport();
    console.log('✓ Viewport tracking initialized');

    // 3. Load authentication state from localStorage
    // Restores user session if tokens exist
    loadAuthState();
    console.log('✓ Authentication state loaded');

    // 4. Initialize authentication service
    // Sets up token refresh scheduling
    initializeAuthService();
    console.log('✓ Authentication service initialized');

    // 5. Initialize router
    // Sets up routing and renders appropriate page
    const appRoot = document.getElementById('app');

    if (!appRoot) {
      throw new Error('App root element not found');
    }

    initializeRouter(appRoot);
    console.log('✓ Router initialized');

    console.log('✅ Smotra initialized successfully');
  } catch (error) {
    console.error('❌ Bootstrap error:', error);

    // Display error to user
    const appRoot = document.getElementById('app');
    if (appRoot) {
      appRoot.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 2rem;
          text-align: center;
        ">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">
              Failed to Initialize Application
            </h1>
            <p style="color: #7a7a7a; margin-bottom: 2rem;">
              ${error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <button 
              onclick="window.location.reload()"
              style="
                padding: 0.75rem 1.5rem;
                background: #3e8ed0;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1rem;
              "
            >
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  // DOM already loaded
  bootstrap();
}