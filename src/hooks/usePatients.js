import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '../api/patientApi';

export function usePatients() {
  return useQuery({ queryKey: ['patients'], queryFn: () => patientApi.getAll() });
}

export function usePatient(id) {
  return useQuery({ queryKey: ['patients', id], queryFn: () => patientApi.getById(id), enabled: !!id });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => patientApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => patientApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => patientApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}
