import { useEffect, useRef, useId } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { HandHeart, Heart } from "lucide-react";
import Button from "@/components/ui/Button";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import { SponsorshipCartSelection } from "./SponsorshipSelection";
import { SPONSORSHIP_CHECKOUT } from "@/lib/sponsorship";
import { captureEvent } from "@/lib/analytics";

// Cart summary; support options and amounts are chosen at checkout.

export default function SponsorshipCartMenu({ onOpen }) {
  const { cartItems, cartCount, subtotal, isCartOpen, toggleCart, closeCart } =
    useSponsorshipCart();
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();
  const reducedMotion = useReducedMotion();
  const { pathname, search } = useLocation();
  const previousRoute = useRef(pathname + search);

  useEffect(() => {
    if (!isCartOpen) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) closeCart();
    }
    function handleKey(event) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      closeCart();
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isCartOpen, closeCart]);

  useEffect(() => {
    const route = pathname + search;
    // Mounting inside the mobile drawer must preserve a cart opened by a page.
    if (previousRoute.current !== route) closeCart();
    previousRoute.current = route;
  }, [pathname, search, closeCart]);

  const checkout = () => {
    closeCart();
    captureEvent("sponsorship_cart_checkout", {
      count: cartCount,
      total: subtotal,
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isCartOpen) onOpen?.();
          toggleCart();
        }}
        aria-label="Sponsorship cart"
        aria-expanded={isCartOpen}
        aria-controls={panelId}
        title="Sponsorship cart"
        className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl text-on-surface hover:text-vibrant-blue hover:bg-surface transition-colors"
      >
        <HandHeart className="h-6 w-6" aria-hidden="true" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-hope-orange text-white text-[0.68rem] font-bold flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.15 }}
            className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] max-lg:fixed max-lg:inset-x-3 max-lg:top-24 max-lg:mt-0 max-lg:w-auto max-lg:max-w-none bg-white rounded-xl border border-soft-accent shadow-xl z-40 max-h-[calc(100dvh-7rem)] overflow-y-auto"
          >
            <div className="px-4 py-3 border-b border-soft-accent/60 bg-cream/50">
              <p className="font-body text-sm font-semibold text-deep-navy">
                Children to sponsor
              </p>
              <p className="font-body text-xs text-on-surface-variant">
                Review your children, then choose support options at checkout.
              </p>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-6 text-center">
                <Heart className="h-8 w-8 mx-auto text-on-surface-variant/30 mb-3" />
                <p className="font-body text-sm text-on-surface-variant mb-3">
                  Your cart is empty. Add children to sponsor them.
                </p>
                <Button
                  as={Link}
                  to="/sponsor-a-child"
                  variant="lightblue"
                  size="sm"
                  onClick={closeCart}
                >
                  Browse Children
                </Button>
              </div>
            ) : (
              <div className="p-3">
                <SponsorshipCartSelection compact />
                <Link
                  to="/sponsor-a-child"
                  onClick={closeCart}
                  className="mt-3 inline-block text-sm font-semibold text-blue-700 underline"
                >
                  Choose more children
                </Link>
              </div>
            )}

            <div className="p-4 border-t border-soft-accent/60">
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm text-on-surface-variant">
                  Total
                </span>
                <span className="font-body text-base font-bold text-deep-navy">
                  ${subtotal.toLocaleString()}
                </span>
              </div>
              <Button
                variant="lightblue"
                size="sm"
                as={Link}
                to={SPONSORSHIP_CHECKOUT}
                onClick={checkout}
                className="w-full"
              >
                {cartCount > 0
                  ? `Continue sponsorship · $${subtotal.toLocaleString()}`
                  : "Sponsorship checkout"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
