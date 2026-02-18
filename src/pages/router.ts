/**
 * Client-side router
 * Handles routing with auth guards and smooth scroll navigation
 */

import { LoginPage } from './login.js';
import { OAuthCallbackPage } from './oauth-callback.js';
import { DashboardPage } from './dashboard.js';
import { canAccessRoute, protectRoute } from '../auth/auth-guard.js';
import { smoothScrollTo } from '../utils/dom-helpers.js';

interface Route {
  path: string;
  component: typeof LoginPage | typeof OAuthCallbackPage | typeof DashboardPage;
  protected: boolean;
  public?: boolean;
}

/**
 * Simple client-side router
 */
export class Router {
  private routes: Route[] = [
    { path: '/', component: DashboardPage, protected: true },
    { path: '/dashboard', component: DashboardPage, protected: true },
    { path: '/login', component: LoginPage, protected: false, public: true },
    { path: '/auth/callback', component: OAuthCallbackPage, protected: false, public: true },
  ];
  
  private currentPage: LoginPage | OAuthCallbackPage | DashboardPage | null = null;
  private appRoot: HTMLElement;
  
  constructor(appRoot: HTMLElement) {
    this.appRoot = appRoot;
  }
  
  /**
   * Initialize router
   */
  init(): void {
    // Handle popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });
    
    // Handle custom navigate events (from sidebar, etc.)
    window.addEventListener('navigate', ((event: CustomEvent) => {
      this.navigate(event.detail.route);
    }) as EventListener);
    
    // Handle link clicks
    document.addEventListener('click', (e) => {
      const link = (e.target as HTMLElement).closest('a');
      
      if (link && link.href && link.origin === window.location.origin) {
        e.preventDefault();
        this.navigate(link.pathname);
      }
    });
    
    // Navigate to current path
    this.navigate(window.location.pathname, false);
  }
  
  /**
   * Navigate to a route
   */
  async navigate(path: string, pushState: boolean = true): Promise<void> {
    // Find matching route
    const route = this.findRoute(path);
    
    if (!route) {
      console.warn('Route not found:', path);
      this.navigate('/dashboard');
      return;
    }
    
    // Check authentication
    if (route.protected) {
      const result = await canAccessRoute(true);
      if (!result.allowed) {
        // Redirect to login with return URL
        protectRoute(path);
        return;
      }
    }
    
    // Check if authenticated user trying to access public-only pages
    if (route.public) {
      const result = await canAccessRoute(false);
      // If user is authenticated, check if trying to access login/callback
      if (result.allowed) {
        // Redirect authenticated users away from login/callback
        if (path === '/login' || path === '/auth/callback') {
          this.navigate('/dashboard');
          return;
        }
      }
    }
    
    // Update browser history
    if (pushState) {
      window.history.pushState({}, '', path);
    }
    
    // Render page
    await this.renderPage(route);
    
    // Scroll to top
    smoothScrollTo(document.body);
  }
  
  /**
   * Find route by path
   */
  private findRoute(path: string): Route | undefined {
    // Exact match
    let route = this.routes.find(r => r.path === path);
    
    if (route) {
      return route;
    }
    
    // Default to dashboard for authenticated users, login otherwise
    // Note: This is synchronous check, async check happens in navigate()
    return this.routes.find(r => r.path === '/login');
  }
  
  /**
   * Render page component
   */
  private async renderPage(route: Route): Promise<void> {
    // Destroy current page
    if (this.currentPage) {
      this.currentPage.destroy();
      this.currentPage = null;
    }
    
    // Clear app root
    this.appRoot.innerHTML = '';
    
    // Create page container
    const pageContainer = document.createElement('div');
    pageContainer.className = 'page-container';
    this.appRoot.appendChild(pageContainer);
    
    // Create and mount new page
    const PageComponent = route.component as any;
    this.currentPage = new PageComponent(pageContainer);
    this.currentPage!.mount();
  }
  
  /**
   * Get current path
   */
  getCurrentPath(): string {
    return window.location.pathname;
  }
}

/**
 * Global router instance (singleton)
 */
let routerInstance: Router | null = null;

/**
 * Initialize router
 */
export function initializeRouter(appRoot: HTMLElement): Router {
  if (routerInstance) {
    console.warn('Router already initialized');
    return routerInstance;
  }
  
  routerInstance = new Router(appRoot);
  routerInstance.init();
  
  return routerInstance;
}

/**
 * Get router instance
 */
export function getRouter(): Router {
  if (!routerInstance) {
    throw new Error('Router not initialized. Call initializeRouter() first.');
  }
  
  return routerInstance;
}

/**
 * Navigate to route
 */
export function navigate(path: string): void {
  const router = getRouter();
  router.navigate(path);
}
