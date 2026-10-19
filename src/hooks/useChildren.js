import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChildren,
  getChild,
  getAvailableChildren,
  createChild,
  updateChild,
  deleteChild,
} from "@/services/children";

// publicOnly: fetch only the photo-level columns signed-out visitors may see.
export function useChildren({ publicOnly = false, enabled = true } = {}) {
  return useQuery({
    queryKey: ["children", publicOnly ? "public" : "full"],
    queryFn: () => getChildren({ publicOnly }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChild(id, { publicOnly = false, enabled = true } = {}) {
  return useQuery({
    queryKey: ["children", id, publicOnly ? "public" : "full"],
    queryFn: () => getChild(id, { publicOnly }),
    enabled: !!id && enabled,
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
