import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPartners,
  getAllPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from "@/services/partners";

export function usePartners() {
  return useQuery({
    queryKey: ["partners"],
    queryFn: getPartners,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllPartners() {
  return useQuery({
    queryKey: ["partners", "all"],
    queryFn: getAllPartners,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}
