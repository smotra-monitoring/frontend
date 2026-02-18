/**
 * Command palette component
 * Cmd+K / Ctrl+K search modal
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { Agent } from '../types/dashboard-types.js';
import { getAgents } from '../state/agent-state.js';
import { smoothScrollTo } from '../utils/dom-helpers.js';

interface CommandPaletteState extends ComponentState {
  visible: boolean;
  query: string;
  results: CommandResult[];
  selectedIndex: number;
}

interface CommandResult {
  id: string;
  type: 'agent' | 'action';
  label: string;
  description?: string;
  action: () => void;
}

/**
 * Command palette modal for fuzzy search
 */
export class CommandPalette extends BaseComponent<CommandPaletteState> {
  private static SHORTCUT_KEY = 'k';
  
  constructor(root: HTMLElement) {
    super(root, {
      visible: false,
      query: '',
      results: [],
      selectedIndex: 0,
    });
  }
  
  render(): void {
    const { visible, query, results, selectedIndex } = this.state;
    
    if (!visible) {
      this.root.innerHTML = '';
      this.root.classList.remove('command-palette--visible');
      return;
    }
    
    this.root.classList.add('command-palette--visible');
    this.root.innerHTML = `
      <div class="command-palette__overlay" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="command-palette__modal ${this.isMobile() ? 'command-palette__modal--mobile' : ''}">
          <div class="command-palette__header">
            <div class="command-palette__search">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <input
                type="text"
                class="command-palette__input"
                placeholder="Search agents or actions..."
                value="${this.escapeHtml(query)}"
                aria-label="Search"
                autocomplete="off"
              />
            </div>
            <button 
              class="command-palette__close button is-ghost"
              aria-label="Close"
            >
              <span class="icon">
                <i class="fas fa-times"></i>
              </span>
            </button>
          </div>
          
          <div class="command-palette__results">
            ${results.length > 0 ? this.renderResults(results, selectedIndex) : this.renderEmpty(query)}
          </div>
          
          <div class="command-palette__footer">
            <kbd>↑↓</kbd> Navigate
            <kbd>↵</kbd> Select
            <kbd>Esc</kbd> Close
          </div>
        </div>
      </div>
    `;
    
    this.attachEventListeners();
    
    // Focus input
    const input = this.query<HTMLInputElement>('.command-palette__input');
    if (input) {
      setTimeout(() => input.focus(), 0);
    }
  }
  
  private renderResults(results: CommandResult[], selectedIndex: number): string {
    return `
      <ul class="command-palette__list" role="listbox">
        ${results.map((result, index) => `
          <li 
            class="command-palette__item ${index === selectedIndex ? 'command-palette__item--selected' : ''}"
            role="option"
            data-index="${index}"
            aria-selected="${index === selectedIndex}"
          >
            <div class="command-palette__item-icon">
              <i class="fas fa-${result.type === 'agent' ? 'server' : 'bolt'}"></i>
            </div>
            <div class="command-palette__item-content">
              <div class="command-palette__item-label">${this.highlightQuery(result.label, this.state.query)}</div>
              ${result.description ? `
                <div class="command-palette__item-description">${this.escapeHtml(result.description)}</div>
              ` : ''}
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  }
  
  private renderEmpty(query: string): string {
    if (!query) {
      return `
        <div class="command-palette__empty">
          <p>Type to search agents...</p>
        </div>
      `;
    }
    
    return `
      <div class="command-palette__empty">
        <p>No results found for "${this.escapeHtml(query)}"</p>
      </div>
    `;
  }
  
  private attachEventListeners(): void {
    // Close button
    const closeButton = this.query('.command-palette__close');
    if (closeButton) {
      this.addEventListener(closeButton, 'click', () => this.hide());
    }
    
    // Overlay click
    const overlay = this.query('.command-palette__overlay');
    if (overlay) {
      this.addEventListener(overlay, 'click', (e) => {
        if (e.target === overlay) {
          this.hide();
        }
      });
    }
    
    // Input
    const input = this.query<HTMLInputElement>('.command-palette__input');
    if (input) {
      this.addEventListener(input, 'input', (e) => {
        const target = e.target as HTMLInputElement;
        this.handleSearch(target.value);
      });
      
      this.addEventListener(input, 'keydown', (e) => {
        this.handleKeydown(e as KeyboardEvent);
      });
    }
    
    // Result items
    this.queryAll('.command-palette__item').forEach((item, index) => {
      this.addEventListener(item, 'click', () => {
        this.selectResult(index);
      });
      
      this.addEventListener(item, 'mouseenter', () => {
        this.setState({ selectedIndex: index });
      });
    });
  }
  
  private handleSearch(query: string): void {
    this.setState({
      query,
      results: this.searchResults(query),
      selectedIndex: 0,
    });
  }
  
  private searchResults(query: string): CommandResult[] {
    if (!query) {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    const agents = getAgents();
    
    // Search agents
    const agentResults: CommandResult[] = agents
      .filter((agent: Agent) => 
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.hostname?.toLowerCase().includes(lowerQuery) ||
        agent.ipAddress?.toLowerCase().includes(lowerQuery) ||
        agent.ip?.toLowerCase().includes(lowerQuery)
      )
      .map((agent: Agent) => ({
        id: agent.id,
        type: 'agent' as const,
        label: agent.name,
        description: agent.hostname || agent.ipAddress,
        action: () => this.navigateToAgent(agent),
      }));
    
    // TODO: Add action results (e.g., "Add agent", "View logs", etc.)
    
    return agentResults.slice(0, 10); // Limit to 10 results
  }
  
  private handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        this.hide();
        e.preventDefault();
        break;
      
      case 'ArrowDown':
        this.moveSelection(1);
        e.preventDefault();
        break;
      
      case 'ArrowUp':
        this.moveSelection(-1);
        e.preventDefault();
        break;
      
      case 'Enter':
        this.selectResult(this.state.selectedIndex);
        e.preventDefault();
        break;
    }
  }
  
  private moveSelection(delta: number): void {
    const { results, selectedIndex } = this.state;
    
    if (results.length === 0) {
      return;
    }
    
    let newIndex = selectedIndex + delta;
    
    if (newIndex < 0) {
      newIndex = results.length - 1;
    } else if (newIndex >= results.length) {
      newIndex = 0;
    }
    
    this.setState({ selectedIndex: newIndex });
    
    // Scroll into view
    const item = this.query(`.command-palette__item[data-index="${newIndex}"]`);
    if (item) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  
  private selectResult(index: number): void {
    const result = this.state.results[index];
    
    if (result) {
      this.hide();
      result.action();
    }
  }
  
  private navigateToAgent(agent: Agent): void {
    // Scroll to agent card
    const agentCard = document.querySelector(`[data-agent-id="${agent.id}"]`);
    
    if (agentCard) {
      smoothScrollTo(agentCard as HTMLElement);
    }
  }
  
  private highlightQuery(text: string, query: string): string {
    if (!query) {
      return this.escapeHtml(text);
    }
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }
  
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Show command palette
   */
  show(): void {
    this.setState({
      visible: true,
      query: '',
      results: [],
      selectedIndex: 0,
    });
  }
  
  /**
   * Hide command palette
   */
  hide(): void {
    this.setState({
      visible: false,
    });
  }
  
  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.state.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  onMount(): void {
    // Register global keyboard shortcut (Cmd+K / Ctrl+K)
    this.addEventListener(window, 'keydown', (e) => {
      const event = e as KeyboardEvent;
      
      if ((event.metaKey || event.ctrlKey) && event.key === CommandPalette.SHORTCUT_KEY) {
        this.toggle();
        event.preventDefault();
      }
    });
  }
}
