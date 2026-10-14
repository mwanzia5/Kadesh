import { useQuery, useQueryClient } from "@tanstack/react-query";
import supabase from "@/supabase/client";
import { currentFundingYear } from "@/lib/sponsorship";
import { fetchAnnualFunding } from "@/lib/annualFunding";

export async function getAnnualFunding(
  year = currentFundingYear(),
  previous = {},
) {
  return fetchAnnualFunding(supabase, year, previous);
}

export function useAnnualFunding(enabled = true) {
  const year = currentFundingYear();
  const queryClient = useQueryClient();
  const queryKey = ["annual-child-funding", year];
  return useQuery({
    queryKey,
    queryFn: () => getAnnualFunding(year, queryClient.getQueryData(queryKey)),
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
