import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  ActiveFeature,
  ComposedEmail,
  FeatureCheckout,
  FeaturedAvailability,
  Publication,
  PublicationFromLinkPayload,
} from "../types/models";

/** The publication currently in the paid featured slot, or `null` if none is booked.
 *
 * Refreshed on a slow timer rather than cached hard, so the live visit counter on the
 * card ticks up on its own instead of freezing at whatever it was on page load.
 */
export function useActiveFeature() {
  return useQuery<ActiveFeature | null, Error>({
    queryKey: ["featured", "active"],
    queryFn: () => api.get<ActiveFeature | null>("/api/featured/active").then((r) => r.data),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false, // don't poll a tab nobody is looking at
  });
}

/** Booked ranges + the price map. Always refetched on open so the calendar is never stale. */
export function useFeatureAvailability(enabled: boolean) {
  return useQuery<FeaturedAvailability, Error>({
    queryKey: ["featured", "availability"],
    queryFn: () =>
      api.get<FeaturedAvailability>("/api/featured/availability").then((r) => r.data),
    enabled,
    refetchOnMount: "always",
    staleTime: 0,
  });
}

/** Draft the announcement so the author can read and edit it before paying. */
export function useComposeEmail() {
  return useMutation<
    ComposedEmail,
    Error,
    { publication_id: string; start_date: string; duration_days: number }
  >({
    mutationFn: (vars) =>
      api.post<ComposedEmail>("/api/featured/compose", vars).then((r) => r.data),
  });
}

interface CheckoutVars {
  publication_id: string;
  start_date: string;
  duration_days: number;
  email_subject: string;
  email_body: string;
  email_button_text: string;
  /** A UTC instant (ISO). The browser converts from the author's local date + hour. */
  email_scheduled_at: string;
  email_timezone: string;
}

/** Holds the dates and hands back a Stripe Checkout URL; the caller redirects to it. */
export function useCreateFeatureCheckout() {
  return useMutation<FeatureCheckout, Error, CheckoutVars>({
    mutationFn: (vars) =>
      api.post<FeatureCheckout>("/api/featured/checkout", vars).then((r) => r.data),
    onSuccess: (data) => {
      window.location.href = data.checkout_url;
    },
  });
}

/** Create (or reuse) an unlisted publication from an arbitrary URL, to feature
 *  something that was never submitted to BlogHub. Reusing the same URL under the
 *  same account is idempotent — it just returns the existing row. */
export function useCreatePublicationFromLink() {
  return useMutation<Publication, Error, PublicationFromLinkPayload>({
    mutationFn: (payload) =>
      api.post<Publication>("/api/publications/from-link", payload).then((r) => r.data),
  });
}
