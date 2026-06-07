export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  autoRefresh: boolean;
  columnsPerRow: 'auto' | number;
}
