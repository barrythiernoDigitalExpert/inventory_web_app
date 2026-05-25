export type Period = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface DateRangeFilter {
  gte?: Date;
  lte?: Date;
  lt?: Date;
}

export function buildDateRangeFilter(
  period: Period,
  startDate?: string | null,
  endDate?: string | null
): DateRangeFilter | null {
  const now = new Date();

  switch (period) {
    case 'today':
      return {
        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      };
    case 'week':
      return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    case 'month':
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    case 'custom':
      if (startDate && endDate) {
        return {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }
      return null;
    default:
      return null;
  }
}
