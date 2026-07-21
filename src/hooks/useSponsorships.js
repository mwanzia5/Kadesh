import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSponsorships,
  getSponsorship,
  createSponsorship,
  updateSponsorship,
  cancelSponsorship,
  getDonorDonations,
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
    },
  });
}

export function useDonorDonations(donorId) {
  return useQuery({
    queryKey: ["donor-donations", donorId],
    queryFn: () => getDonorDonations(donorId),
    enabled: !!donorId,
    staleTime: 5 * 60 * 1000,
  });
}
