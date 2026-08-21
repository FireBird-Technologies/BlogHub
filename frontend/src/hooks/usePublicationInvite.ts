import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";

export interface InviteResult {
  sent: string[];
  failed: string[];
}

/** Email people a link to a publication, inviting them to read it and join BlogHub.
 *
 * The response reports per-address outcomes rather than a single success flag: one
 * bad address does not discard the invites that did go out, so the caller can tell
 * the sender exactly which ones landed.
 */
export function useInviteToPublication(publicationId: string) {
  return useMutation<InviteResult, Error, { emails: string[] }>({
    mutationFn: (vars) =>
      api
        .post<InviteResult>(`/api/publications/${publicationId}/invite`, vars)
        .then((r) => r.data),
  });
}
