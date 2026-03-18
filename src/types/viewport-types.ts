/**
 * Viewport and responsive design type definitions
 */

export interface ViewportState {
  width: number;
  height: number;
  breakpoint: BreakpointName;
  orientation: Orientation;
  devicePixelRatio: number;
  optimalColumns: number;
}

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide';

type Orientation = 'portrait' | 'landscape';

interface Breakpoint {
  name: BreakpointName;
  minWidth: number;
  maxWidth?: number;
  columns: ColumnRange;
}

export interface ColumnRange {
  min: number;
  max: number;
}

export const BREAKPOINTS: Breakpoint[] = [
  {
    name: 'mobile',
    minWidth: 0,
    maxWidth: 767,
    columns: { min: 1, max: 1 }
  },
  {
    name: 'tablet',
    minWidth: 768,
    maxWidth: 1023,
    columns: { min: 2, max: 2 }
  },
  {
    name: 'desktop',
    minWidth: 1024,
    maxWidth: 1439,
    columns: { min: 3, max: 4 }
  },
  {
    name: 'wide',
    minWidth: 1440,
    maxWidth: 1919,
    columns: { min: 4, max: 5 }
  },
  {
    name: 'ultrawide',
    minWidth: 1920,
    columns: { min: 5, max: 6 }
  }
];

export interface ViewportChangeEvent {
  previous: ViewportState;
  current: ViewportState;
}

export interface ViewportObserverCallback {
  (state: ViewportState): void;
}
