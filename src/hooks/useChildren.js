import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChildren,
  getChild,
  getAvailableChildren,
  createChild,
  updateChild,
  deleteChild,
} from "@/services/children";

export function useChildren() {
  return useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChild(id) {
  return useQuery({
    queryKey: ["children", id],
    queryFn: () => getChild(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAvailableChildren() {
  return useQuery({
    queryKey: ["children", "available"],
    queryFn: getAvailableChildren,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateChild(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useDeleteChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}
