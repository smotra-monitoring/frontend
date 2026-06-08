/**
 * Refresh Control Component
 * 
 * A UI dropdown component that allows the user to select the refresh frequency
 * for dashboard data. It interacts with the RefreshManager to control the
 * global polling interval.
 */

import { BaseComponent } from './base-component.js';
import { setFrequency, getRefreshState, type RefreshFrequency } from '../state/refresh-state.js';
import type { ComponentState } from '../types/component-types.js';

const REFRESH_OPTIONS: { label: string; value: RefreshFrequency }[] = [
    { label: 'Off', value: 'off' },
    { label: '5 s', value: 5000 },
    { label: '15 s', value: 15000 },
    { label: '30 s', value: 30000 },
];

interface RefreshControlState extends ComponentState {
    currentFrequency: RefreshFrequency;
}

export class RefreshControl extends BaseComponent<RefreshControlState> {
    constructor(root: HTMLElement) {
        super(root, {
            currentFrequency: getRefreshState().frequency,
        });
    }

    render(): void {
        const { currentFrequency } = this.state;
        const currentLabel = this.getFrequencyLabel(currentFrequency);

        this.root.innerHTML = `
            <div class="refresh-control">
                ${!this.isMobile() ? '<span class="refresh-control__label">Refresh:</span>' : ''}
                <div class="select">
                    <select 
                        id="refresh-frequency-select" 
                        aria-label="Select dashboard refresh frequency"
                        title="Select refresh frequency"
                    >
                        ${REFRESH_OPTIONS.map(option => `
                            <option 
                                value="${option.value}" 
                                ${option.value === currentFrequency ? 'selected' : ''}
                            >
                                ${option.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    private getFrequencyLabel(frequency: RefreshFrequency): string {
        const option = REFRESH_OPTIONS.find(opt => opt.value === frequency);
        return option ? option.label : 'Off';
    }

    private attachEventListeners(): void {
        const select = this.query<HTMLSelectElement>('#refresh-frequency-select');
        if (select) {
            this.addEventListener(select, 'change', this.handleFrequencyChange.bind(this));
        }
    }

    private handleFrequencyChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const newFrequency = select.value === 'off' ? 'off' : Number(select.value) as RefreshFrequency;

        this.setState({ currentFrequency: newFrequency });
        setFrequency(newFrequency);
    }
}
