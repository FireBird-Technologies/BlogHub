import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { FeaturedEmail, MyBooking } from "../types/models";

const KEY = ["featured", "my-emails"] as const;

// Stripe bounces the buyer straight back to us, but the booking and its announcement
// draft are written by the *webhook*, which arrives independently — measured at ~5s
// behind the redirect. So a single fetch on arrival sees nothing and caches the empty
// result. When we know a payment just landed, poll until the rows show up.
const WEBHOOK_POLL_MS = 2000;
/** Give up after this long — a webhook that never arrives must not poll forever. */
export const WEBHOOK_POLL_TIMEOUT_MS = 60_000;

/** How often to refresh the visit counter while a run is actually live. */
const LIVE_COUNT_POLL_MS = 30_000;

/** The author's own featured bookings, live and upcoming.
 *
 * Polls in two situations:
 *   - `awaitingWebhook` (just back from Stripe): fast, until the booking appears.
 *   - a run is currently live: slowly, so its visit counter ticks up on its own.
 */
export function useMyBookings(enabled = true, awaitingWebhook = false) {
  return useQuery<MyBooking[], Error>({
    queryKey: ["featured", "my-bookings"],
    queryFn: () => api.get<MyBooking[]>("/api/featured/my-bookings").then((r) => r.data),
    enabled,
    // Short, so the live visit count isn't served stale from cache on a revisit.
    staleTime: 15 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Just paid: poll fast until the webhook writes the booking. The caller drops
      // `awaitingWebhook` after a timeout, so a webhook that never lands can't poll
      // forever.
      if (awaitingWebhook && (data?.length ?? 0) === 0) return WEBHOOK_POLL_MS;
      // A run is live — keep its visit count current.
      if (data?.some((b) => b.is_active)) return LIVE_COUNT_POLL_MS;
      return false;
    },
    refetchIntervalInBackground: false, // don't poll a tab nobody is looking at
  });
}

/** Announcement drafts for the signed-in author's featured bookings.
 *
 * Same webhook race as `useMyBookings`: the draft is created by the webhook, not by
 * the redirect, so poll for it when a payment has just gone through.
 */
export function useMyFeaturedEmails(enabled = true, awaitingWebhook = false) {
  return useQuery<FeaturedEmail[], Error>({
    queryKey: KEY,
    queryFn: () => api.get<FeaturedEmail[]>("/api/featured/my-emails").then((r) => r.data),
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: (query) => {
      if (!awaitingWebhook) return false;
      if ((query.state.data?.length ?? 0) > 0) return false;
      const elapsed = Date.now() - (query.state.dataUpdatedAt || Date.now());
      return elapsed > WEBHOOK_POLL_TIMEOUT_MS ? false : WEBHOOK_POLL_MS;
    },
  });
}

export function useUpdateFeaturedEmail() {
  const qc = useQueryClient();
  return useMutation<
    FeaturedEmail,
    Error,
    { id: string; subject: string; body: string; button_text: string }
  >({
    mutationFn: ({ id, subject, body, button_text }) =>
      api
        .patch<FeaturedEmail>(`/api/featured/emails/${id}`, { subject, body, button_text })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApproveFeaturedEmail() {
  const qc = useQueryClient();
  return useMutation<FeaturedEmail, Error, string>({
    mutationFn: (id) =>
      api.post<FeaturedEmail>(`/api/featured/emails/${id}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
