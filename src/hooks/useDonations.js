import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { donationsService } from "@/services/donations";

export function useDonations() {
  return useQuery({
    queryKey: ["donations"],
    queryFn: donationsService.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDonationStats() {
  return useQuery({
    queryKey: ["donation-stats"],
    queryFn: donationsService.getStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDonorDonations(email) {
  return useQuery({
    queryKey: ["donor-donations", email],
    queryFn: () => donationsService.getByDonorEmail(email),
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: donationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.invalidateQueries({ queryKey: ["donation-stats"] });
    },
  });
}

export function useUpdateDonationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => donationsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.invalidateQueries({ queryKey: ["donation-stats"] });
    },
  });
}
