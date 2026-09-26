import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSponsorships,
  getSponsorship,
  getSponsorshipCreditBalance,
  cancelSponsorship,
  pauseSponsorship,
  resumeSponsorship,
  adminCancelSponsorship,
  getDonorDonations,
  getAllSponsorships,
  getSponsorshipOverview,
  sponsorWithCredit,
  reactivateSponsorship,
} from "@/services/sponsorships";

export function useSponsorships(donorId) {
  return useQuery({
    queryKey: ["sponsorships", donorId],
    queryFn: () => getSponsorships(donorId),
    enabled: !!donorId,
    staleTime: 5 * 60 * 1000,
  });
}

// Spendable sponsorship credit in money. The server owns this number (see the
// sponsorship_credit_ledger), so every component reads the same balance rather
// than each recomputing it from cancelled rows — which is what used to drift.
export function useSponsorshipCreditBalance(donorId) {
  return useQuery({
    queryKey: ["sponsorship-credit-balance", donorId],
    queryFn: () => getSponsorshipCreditBalance(),
    enabled: !!donorId,
    staleTime: 30 * 1000,
  });
}

export function useSponsorship(id) {
  return useQuery({
    queryKey: ["sponsorships", id],
    queryFn: () => getSponsorship(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// useCreateSponsorship / useUpdateSponsorship were removed on purpose.
// Sponsorship rows are no longer client-writable: the "Users can insert own
// sponsorships" and "Users can update own sponsorships" RLS policies are
// dropped, because they let any signed-in donor fabricate credit (an
// arbitrary cancelled row) or rewrite an amount. Writes now happen only via
// the service role (verified Paystack payments) and the SECURITY DEFINER RPCs
// sponsorWithCredit / reactivateSponsorship / cancelSponsorship.

// Every path that moves money out of (or back into) the credit balance must
// refresh it, or the card would keep showing the pre-spend figure.
function useInvalidateCreditBalance() {
  const queryClient = useQueryClient();
  return (keys = []) =>
    queryClient.invalidateQueries({
      queryKey: ["sponsorship-credit-balance", ...keys],
    });
}

export function useCancelSponsorship() {
  const queryClient = useQueryClient();
  const invalidateCredit = useInvalidateCreditBalance();

  return useMutation({
    mutationFn: cancelSponsorship,
    onSuccess: () => {
      // Cancelling credits the money back, so the balance changes.
      invalidateCredit();
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useAdminPauseSponsorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseSponsorship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useAdminResumeSponsorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeSponsorship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useAdminCancelSponsorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminCancelSponsorship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useSponsorWithCredit() {
  const queryClient = useQueryClient();
  const invalidateCredit = useInvalidateCreditBalance();

  return useMutation({
    mutationFn: sponsorWithCredit,
    onSuccess: () => {
      invalidateCredit();
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useReactivateSponsorship() {
  const queryClient = useQueryClient();
  const invalidateCredit = useInvalidateCreditBalance();

  return useMutation({
    // `amount` is the figure charged against the donor's credit balance.
    // `periodStart` re-anchors the monthly billing period, used when a
    // reactivation is paid for with fresh money rather than existing credit.
    mutationFn: ({ id, plan, amount, periodStart }) =>
      reactivateSponsorship(id, plan, amount, periodStart),
    onSuccess: () => {
      invalidateCredit();
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useDonorDonations(donorId, donorEmail) {
  return useQuery({
    queryKey: ["donor-donations", donorId, donorEmail],
    queryFn: () => getDonorDonations(donorId, donorEmail),
    enabled: !!(donorId || donorEmail),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllSponsorships() {
  return useQuery({
    queryKey: ["all-sponsorships"],
    queryFn: getAllSponsorships,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSponsorshipOverview() {
  return useQuery({
    queryKey: ["sponsorship-overview"],
    queryFn: getSponsorshipOverview,
    staleTime: 2 * 60 * 1000,
  });
}
