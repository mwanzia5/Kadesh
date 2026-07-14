import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGalleryImages,
  createGalleryImage,
  deleteGalleryImage,
} from "@/services/gallery";

export function useGalleryImages(category) {
  return useQuery({
    queryKey: ["gallery", { category }],
    queryFn: () => getGalleryImages(category),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}
