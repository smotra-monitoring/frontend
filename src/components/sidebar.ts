/**
 * Sidebar navigation component
 * Responsive: hamburger mobile/tablet, fixed 200px desktop
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { isAuthenticated, getUserInfo } from '../state/auth-state.js';
import { logout } from '../services/auth-service.js';
import { navigate } from '../pages/router.js';

interface SidebarState extends ComponentState {
  expanded: boolean;
  activeRoute: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

/**
 * Sidebar navigation component
 */
export class Sidebar extends BaseComponent<SidebarState> {
  private navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-th', route: '/dashboard' },
    { id: 'agents', label: 'Agents', icon: 'fa-server', route: '/agents' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog', route: '/settings' },
  ];

  constructor(root: HTMLElement) {
    super(root, {
      expanded: false,
      activeRoute: window.location.pathname,
    });
  }

  render(): void {
    const { expanded } = this.state;
    const isMobileOrTablet = this.isMobile() || this.isTablet();

    this.root.innerHTML = `
      ${isMobileOrTablet ? this.renderMobileHeader() : ''}
      
      <aside class="sidebar ${expanded ? 'sidebar--expanded' : ''} ${isMobileOrTablet ? 'sidebar--mobile' : ''}">
        <div class="sidebar__header">
          <h1 class="sidebar__logo">
            <i class="fas fa-chart-line"></i>
            ${!isMobileOrTablet || expanded ? '<span>Smotra</span>' : ''}
          </h1>
          
          ${isMobileOrTablet ? `
            <button 
              class="sidebar__close button is-ghost"
              aria-label="Close menu"
            >
              <span class="icon">
                <i class="fas fa-times"></i>
              </span>
            </button>
          ` : ''}
        </div>
        
        <nav class="sidebar__nav">
          ${this.renderNavItems()}
        </nav>
        
        <div class="sidebar__footer">
          ${this.renderUserInfo()}
          ${this.renderLogoutButton()}
        </div>
      </aside>
      
      ${isMobileOrTablet && expanded ? this.renderOverlay() : ''}
    `;

    this.attachEventListeners();
  }

  private renderMobileHeader(): string {
    return `
      <div class="mobile-header">
        <button 
          class="mobile-header__menu button is-ghost"
          aria-label="Open menu"
          aria-expanded="${this.state.expanded}"
        >
          <span class="icon">
            <i class="fas fa-bars"></i>
          </span>
        </button>
        
        <h1 class="mobile-header__title">Smotra</h1>
        
        <div class="mobile-header__actions">
          <!-- Theme toggle and other actions will be inserted here -->
        </div>
      </div>
    `;
  }

  private renderNavItems(): string {
    return `
      <ul class="sidebar__menu">
        ${this.navItems.map(item => this.renderNavItem(item)).join('')}
      </ul>
    `;
  }

  private renderNavItem(item: NavItem): string {
    const isActive = this.state.activeRoute === item.route;

    return `
      <li>
        <a 
          href="${item.route}"
          class="sidebar__link ${isActive ? 'sidebar__link--active' : ''}"
          data-route="${item.route}"
          aria-current="${isActive ? 'page' : 'false'}"
        >
          <span class="icon">
            <i class="fas ${item.icon}"></i>
          </span>
          <span class="sidebar__link-label">${item.label}</span>
        </a>
      </li>
    `;
  }

  private renderUserInfo(): string {
    if (!isAuthenticated()) {
      return '';
    }

    const userInfo = getUserInfo();

    if (!userInfo) {
      return '';
    }

    return `
      <div class="sidebar__user">
        ${userInfo.picture ? `
          <img 
            src="${userInfo.picture}" 
            alt="${userInfo.name}"
            class="sidebar__user-avatar"
          />
        ` : `
          <div class="sidebar__user-avatar sidebar__user-avatar--placeholder">
            ${userInfo.name.charAt(0).toUpperCase()}
          </div>
        `}
        <div class="sidebar__user-info">
          <div class="sidebar__user-name">${this.escapeHtml(userInfo.name)}</div>
          <div class="sidebar__user-email">${this.escapeHtml(userInfo.email)}</div>
        </div>
      </div>
    `;
  }

  private renderLogoutButton(): string {
    if (!isAuthenticated()) {
      return '';
    }

    return `
      <button 
        class="sidebar__logout button is-ghost is-fullwidth"
        aria-label="Logout"
      >
        <span class="icon">
          <i class="fas fa-sign-out-alt"></i>
        </span>
        <span>Logout</span>
      </button>
    `;
  }

  private renderOverlay(): string {
    return `<div class="sidebar-overlay"></div>`;
  }

  private attachEventListeners(): void {
    // Menu toggle (mobile/tablet)
    const menuButton = document.querySelector('.mobile-header__menu');
    if (menuButton) {
      this.addEventListener(menuButton, 'click', () => this.toggle());
    }

    // Close button (mobile/tablet)
    const closeButton = this.query('.sidebar__close');
    if (closeButton) {
      this.addEventListener(closeButton, 'click', () => this.close());
    }

    // Overlay click (mobile/tablet)
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      this.addEventListener(overlay, 'click', () => this.close());
    }

    // Nav links
    this.queryAll('.sidebar__link').forEach(link => {
      this.addEventListener(link, 'click', (e) => {
        e.preventDefault();
        const route = (link as HTMLAnchorElement).dataset.route!;
        this.sidebar_navigate(route);
      });
    });

    // Logout button
    const logoutButton = this.query('.sidebar__logout');
    if (logoutButton) {
      this.addEventListener(logoutButton, 'click', async () => {
        await logout();
      });
    }
  }

  private async sidebar_navigate(route: string): Promise<void> {
    // Close sidebar on mobile
    if (this.isMobile() || this.isTablet()) {
      this.close();
    }

    // Update active route
    this.setState({ activeRoute: route });

    // Dispatch navigation event (will be handled by router)
    await navigate(route);
  }

  /**
   * Open sidebar
   */
  open(): void {
    this.setState({ expanded: true });
  }

  /**
   * Close sidebar
   */
  close(): void {
    this.setState({ expanded: false });
  }

  /**
   * Toggle sidebar
   */
  toggle(): void {
    this.setState({ expanded: !this.state.expanded });
  }

  /**
   * Set active route
   */
  setActiveRoute(route: string): void {
    this.setState({ activeRoute: route });
  }

  onViewportChange(): void {
    // Close sidebar when switching from mobile to desktop
    if (this.isDesktop() && this.state.expanded) {
      this.close();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
