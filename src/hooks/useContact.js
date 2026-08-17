import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMessages,
  sendMessage,
  markAsRead,
  markAsUnread,
  deleteMessage,
  updateMessage,
  replyToMessage,
} from "@/services/contact";

export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: getMessages,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsUnread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// Generic { id, data } patch — matches the { id, data } shape already used
// by useUpdateSponsorship / useUpdateChild elsewhere in this codebase.
export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// { id, reply } — sends the reply email and records it on the message.
export function useReplyToMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: replyToMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}