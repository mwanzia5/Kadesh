import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPageContent,
  getAllPageContent,
  updatePageContent,
  resetPageContent,
} from "@/services/pageContent";

export function usePageContent(pageSlug) {
  return useQuery({
    queryKey: ["pageContent", pageSlug],
    queryFn: () => getPageContent(pageSlug),
    enabled: !!pageSlug,
    staleTime: 5 * 60 * 1000,
  });
}

// NEW
export function useAllPageContent() {
  return useQuery({
    queryKey: ["pageContent", "all"],
    queryFn: getAllPageContent,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useUpdatePageContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageSlug, sectionKey, content }) =>
      updatePageContent(pageSlug, sectionKey, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageContent"] });
    },
  });
}

// NEW
export function useResetPageContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageSlug) => resetPageContent(pageSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageContent"] });
    },
  });
}