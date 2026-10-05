import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../api/appointmentApi';

export function useAppointments(date) {
  return useQuery({
    queryKey: ['appointments', date || 'all'],
    queryFn: () => appointmentApi.getAll(date),
  });
}

export function useAppointment(id) {
  return useQuery({ queryKey: ['appointments', id], queryFn: () => appointmentApi.getById(id), enabled: !!id });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => appointmentApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => appointmentApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => appointmentApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}
