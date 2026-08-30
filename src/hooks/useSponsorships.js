import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSponsorships,
  getSponsorship,
  createSponsorship,
  updateSponsorship,
  cancelSponsorship,
  getDonorDonations,
  getAllSponsorships,
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

export function useSponsorship(id) {
  return useQuery({
    queryKey: ["sponsorships", id],
    queryFn: () => getSponsorship(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSponsorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSponsorship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
    },
  });
}

export function useUpdateSponsorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateSponsorship(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
    },
  });
}

export function useCancelSponsorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSponsorship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useSponsorWithCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sponsorWithCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useReactivateSponsorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateSponsorship,
    onSuccess: () => {
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
