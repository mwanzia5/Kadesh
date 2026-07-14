import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, getAllSettings, updateSetting } from "@/services/settings";

export function useSetting(key) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: () => getSetting(key),
    enabled: !!key,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: getAllSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
