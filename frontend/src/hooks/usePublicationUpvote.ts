import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import api from "../lib/api";
import type { Publication } from "../types/models";
import type { UpvoteResponse } from "../types/api";

function defaultMatch(pub: Publication | undefined, publicationId: string): boolean {
  return !!pub && String(pub.id) === String(publicationId);
}

function toggleItem(item: Publication, publicationId: string): Publication {
  if (!defaultMatch(item, publicationId)) return item;
  return {
    ...item,
    is_upvoted: !item.is_upvoted,
    upvote_count: item.is_upvoted ? item.upvote_count - 1 : item.upvote_count + 1,
  };
}

/** Optimistic toggle for infinite list cache or single publication detail. */
function applyToggle(old: unknown, publicationId: string): unknown {
  if (!old || typeof old !== "object") return old;
  const o = old as Record<string, unknown>;
  if ("pages" in o && Array.isArray(o.pages)) {
    return {
      ...o,
      pages: (o.pages as Array<{ items: Publication[] } & Record<string, unknown>>).map((page) => ({
        ...page,
        items: page.items.map((item) => toggleItem(item, publicationId)),
      })),
    };
  }
  if ("id" in o) {
    return toggleItem(o as unknown as Publication, publicationId);
  }
  return old;
}

interface MutationContext {
  prev: unknown;
}

export function usePublicationUpvote(publicationId: string, queryKey: QueryKey) {
  const queryClient = useQueryClient();

  return useMutation<UpvoteResponse, Error, void, MutationContext>({
    mutationFn: () => api.post<UpvoteResponse>(`/api/publications/${publicationId}/upvote`).then((r) => r.data),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => applyToggle(old, publicationId));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "publication" &&
          String(q.queryKey[1]) === String(publicationId),
      });
    },
  });
}
