import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { SocialLinkInput } from "../types/models";

export interface ClaimPayload {
  name: string;
  social_links: SocialLinkInput[];
  original_url?: string;
  comment?: string;
}

interface ClaimResponse {
  id: string;
  status: string;
  created_at: string;
  verified_at: string | null;
}

export function useClaimPublication(publicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClaimPayload) =>
      api
        .post<ClaimResponse>(`/api/publications/${publicationId}/claim`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["publication", publicationId] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-publications"] });
      queryClient.invalidateQueries({ queryKey: ["publications-preview"] });
    },
  });
}
