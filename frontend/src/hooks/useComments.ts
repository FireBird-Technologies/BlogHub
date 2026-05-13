import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Comment } from "../types/models";

export function useComments(publicationId: string | null | undefined) {
  return useQuery<Comment[]>({
    queryKey: ["comments", publicationId],
    queryFn: () =>
      api.get<Comment[]>(`/api/publications/${publicationId}/comments`).then((r) => r.data),
    enabled: !!publicationId,
    staleTime: 0,
  });
}

export function useAddComment(publicationId: string) {
  const queryClient = useQueryClient();
  return useMutation<Comment, Error, string>({
    mutationFn: (content) =>
      api.post<Comment>(`/api/publications/${publicationId}/comments`, { content }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", publicationId] });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
    },
  });
}

export function useDeleteComment(publicationId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (commentId) => api.delete(`/api/comments/${commentId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", publicationId] });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
    },
  });
}
