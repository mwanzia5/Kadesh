import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPageContent, updatePageContent } from "@/services/pageContent";

export function usePageContent(pageSlug) {
  return useQuery({
    queryKey: ["pageContent", pageSlug],
    queryFn: () => getPageContent(pageSlug),
    enabled: !!pageSlug,
    staleTime: 5 * 60 * 1000,
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
