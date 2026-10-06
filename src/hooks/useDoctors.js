import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi } from '../api/doctorApi';
import { authApi } from '../api/authApi';

export function useDoctors() {
  return useQuery({ queryKey: ['doctors'], queryFn: () => doctorApi.getAll() });
}

export function useDoctor(id) {
  return useQuery({ queryKey: ['doctors', id], queryFn: () => doctorApi.getById(id), enabled: !!id });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => doctorApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => doctorApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}
