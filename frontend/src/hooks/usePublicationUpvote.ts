import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import api from "../lib/api";
import {
  findPublicationInData,
  patchPublicationInCache,
  publicationQueriesFilter,
} from "../lib/publicationCache";
import type { UpvoteResponse } from "../types/api";

interface MutationContext {
  snapshot: Array<[QueryKey, unknown]>;
}

/**
 * Toggle an upvote. The new count/state is written into every cached list and
 * the detail record at once (optimistically, then corrected with the server's
 * numbers), so no page has to refetch to show it.
 */
export function usePublicationUpvote(publicationId: string, queryKey: QueryKey) {
  const queryClient = useQueryClient();

  return useMutation<UpvoteResponse, Error, void, MutationContext>({
    mutationFn: () => api.post<UpvoteResponse>(`/api/publications/${publicationId}/upvote`).then((r) => r.data),
    onMutate: async () => {
      // Only cancel the query being clicked: cancelling another list's first
      // load would leave it stuck without data.
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueriesData(publicationQueriesFilter(publicationId));
      const current = findPublicationInData(queryClient.getQueryData(queryKey), publicationId);
      if (current) {
        // Derive the target state once from what the user clicked, so every
        // cache ends up identical even if they had drifted apart.
        patchPublicationInCache(queryClient, publicationId, {
          is_upvoted: !current.is_upvoted,
          upvote_count: current.upvote_count + (current.is_upvoted ? -1 : 1),
        });
      }
      return { snapshot };
    },
    onSuccess: (res) => {
      patchPublicationInCache(queryClient, publicationId, {
        is_upvoted: res.is_upvoted,
        upvote_count: res.upvote_count,
      });
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
  });
}
