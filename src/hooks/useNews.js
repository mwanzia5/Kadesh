import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNews,
  getAllNews,
  getNewsArticle,
  createArticle,
  updateArticle,
  deleteArticle,
} from "@/services/news";

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: getNews,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllNews() {
  return useQuery({
    queryKey: ["news", "all"],
    queryFn: getAllNews,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewsArticle(slug) {
  return useQuery({
    queryKey: ["news", slug],
    queryFn: () => getNewsArticle(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });
}
