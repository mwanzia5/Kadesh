import { Navigate, useSearchParams } from "react-router-dom";
import GivingCheckout from "./GivingCheckout";
import { SPONSORSHIP_CHECKOUT } from "@/lib/sponsorship";

export default function Donate() {
  const [params] = useSearchParams();
  if (params.get("purpose") === "sponsorship") {
    const childId = params.get("child_id");
    return (
      <Navigate
        replace
        to={
          params.get("cart") === "1"
            ? SPONSORSHIP_CHECKOUT
            : childId
              ? "/sponsor-a-child/" + encodeURIComponent(childId)
              : "/sponsor-a-child"
        }
      />
    );
  }
  return <GivingCheckout mode="donation" />;
}
