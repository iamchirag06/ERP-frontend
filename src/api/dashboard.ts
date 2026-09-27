import { api } from '@/lib/api';
import type { DashboardStats } from '@/types/operations';

export const getDashboardStats = () =>
  api.get<DashboardStats>('/api/dashboard/stats').then((r) => r.data);