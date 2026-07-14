import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVideos,
  getFeaturedVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from "@/services/videos";

export function useVideos(category) {
  return useQuery({
    queryKey: ["videos", { category }],
    queryFn: () => getVideos(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedVideos() {
  return useQuery({
    queryKey: ["videos", "featured"],
    queryFn: getFeaturedVideos,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
