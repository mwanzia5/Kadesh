import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Minus, Plus, X, Heart } from "lucide-react";
import Button from "@/components/ui/Button";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import SponsorshipAmountInput from "@/components/cart/SponsorshipAmountInput";
import { captureEvent } from "@/lib/analytics";

// Global sponsorship cart control in the navbar — the +human icon. Clicking
// "Sponsor" on a child adds them here instead of jumping straight to the
// donation page. The menu shows each child's photo/name and a +/− stepper to
// set their sponsorship amount, then the running total, and one Donate button
// that pays for all of them in a single checkout on the donation page.
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const MAX_AMOUNT = 100000;
const MIN_AMOUNT = 0.01;

export default function SponsorshipCartMenu() {
  const {
    cartItems,
    cartCount,
    subtotal,
    isCartOpen,
    setItemAmount,
    removeFromCart,
    toggleCart,
    closeCart,
  } = useSponsorshipCart();
  const ref = useRef(null);
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!isCartOpen) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) closeCart();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isCartOpen, closeCart]);

  useEffect(() => {
    closeCart();
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
        onClick={toggleCart}
        aria-label="Sponsorship cart"
        title="Sponsorship cart"
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-on-surface hover:text-vibrant-blue hover:bg-surface transition-colors"
      >
        <UserPlus className="h-6 w-6" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-hope-orange text-white text-[0.68rem] font-bold flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-soft-accent shadow-xl z-40 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-soft-accent/60 bg-cream/50">
              <p className="font-body text-sm font-semibold text-deep-navy">
                Children to sponsor
              </p>
              <p className="font-body text-xs text-on-surface-variant">
                Adjust each amount, then pay for all in one checkout
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
              <ul className="max-h-72 overflow-y-auto divide-y divide-soft-accent/40">
                {cartItems.map((item) => (
                  <li key={item.child_id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-vibrant-blue/15 to-hope-orange/15 flex items-center justify-center">
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.first_name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-lg font-bold text-vibrant-blue/40">
                          {(item.first_name || "?").charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-medium text-deep-navy truncate">
                        {item.first_name}
                      </p>
                      {item.location && (
                        <p className="font-body text-xs text-on-surface-variant truncate">
                          {item.location}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center rounded-lg border border-soft-accent/70 overflow-hidden">
                      <button
                        onClick={() =>
                          setItemAmount(
                            item.child_id,
                            Math.max(MIN_AMOUNT, round2(item.amount - 1))
                          )
                        }
                        aria-label={`Decrease ${item.first_name}'s sponsorship amount`}
                        className="p-1.5 text-on-surface-variant hover:text-vibrant-blue hover:bg-surface transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <SponsorshipAmountInput
                        value={item.amount}
                        onCommit={(v) => setItemAmount(item.child_id, v)}
                        min={MIN_AMOUNT}
                        aria-label={`${item.first_name}'s sponsorship amount`}
                        className="w-16 bg-transparent text-center font-body text-sm font-semibold text-deep-navy outline-none"
                      />
                      <button
                        onClick={() =>
                          setItemAmount(
                            item.child_id,
                            Math.min(MAX_AMOUNT, round2(item.amount + 1))
                          )
                        }
                        aria-label={`Increase ${item.first_name}'s sponsorship amount`}
                        className="p-1.5 text-on-surface-variant hover:text-vibrant-blue hover:bg-surface transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.child_id)}
                      aria-label={`Remove ${item.first_name} from cart`}
                      className="text-on-surface-variant hover:text-hope-orange transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
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
                to="/donate?purpose=sponsorship&cart=1"
                onClick={checkout}
                className="w-full"
              >
                {cartCount > 0
                  ? `Donate $${subtotal.toLocaleString()}`
                  : "Go to Donation Page"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}