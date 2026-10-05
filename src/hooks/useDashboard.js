import request from '../api/request';
import { useQuery } from '@tanstack/react-query';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => request('/dashboard/stats'),
  });
}
