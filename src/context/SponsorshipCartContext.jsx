import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { captureEvent } from "@/lib/analytics";
import {
  addSponsorshipChild,
  changeSponsorshipFrequency,
  DEFAULT_SPONSORSHIP_PLAN,
  getSponsorshipOption,
  isSelectableSponsorshipOption,
  MONTHLY_SPONSORSHIP_AMOUNTS,
  getSponsorshipSubtotal,
  normalizeSponsorshipItem,
  restoreSponsorshipCart,
} from "@/lib/sponsorship";

const STORAGE_KEY = "khm_sponsorship_cart";
const SponsorshipCartContext = createContext(null);

export function SponsorshipCartProvider({ children }) {
  const [{ items: cartItems, frequency }, setCart] = useState({
    items: [],
    frequency: "one-time",
  });
  const [loaded, setLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      setCart(restoreSponsorshipCart(saved));
    } catch {
      setCart({ items: [], frequency: "one-time" });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 3, frequency, items: cartItems }),
      );
    } catch {
      /* The cart still works if device storage is unavailable. */
    }
  }, [cartItems, frequency, loaded]);

  const setFrequency = useCallback((value) => {
    if (!["one-time", "monthly"].includes(value)) return;
    setCart((cart) => ({
      frequency: value,
      items: changeSponsorshipFrequency(cart.items, value),
    }));
  }, []);

  // supportType: "education" | "supplies" | "meals" | "full" | "monthly".
  // Without one, a new child starts on Education fees ($100), or $25/month
  // when the cart is already monthly.
  const addToCart = useCallback((child, supportType, monthlyAmount) => {
    if (typeof child?.id !== "string" || !child.id) return;
    const option = getSponsorshipOption(supportType || DEFAULT_SPONSORSHIP_PLAN);
    captureEvent("sponsorship_cart_added", {
      child_id: child.id,
      plan: option?.id,
      amount: supportType === "monthly" ? monthlyAmount || option?.amount : option?.amount,
    });
    setCart((cart) =>
      addSponsorshipChild(cart, child, supportType, monthlyAmount),
    );
  }, []);

  const setItemPlan = useCallback((childId, supportType) => {
    const option = getSponsorshipOption(supportType);
    if (!option || !isSelectableSponsorshipOption(option.id)) return;
    setCart((cart) => {
      if ((option.id === "monthly") !== (cart.frequency === "monthly"))
        return cart;
      return {
        ...cart,
        items: cart.items.map((item) =>
          item.child_id === childId
            ? normalizeSponsorshipItem({
                ...item,
                support_type: supportType,
                one_time_type:
                  supportType === "monthly" ? item.one_time_type : supportType,
              })
            : item,
        ),
      };
    });
  }, []);
  // Monthly sponsorship: $25 or $50 per month for this child.
  const setItemMonthlyAmount = useCallback((childId, amount) => {
    if (!MONTHLY_SPONSORSHIP_AMOUNTS.includes(Number(amount))) return;
    setCart((cart) => ({
      ...cart,
      items: cart.items.map((item) =>
        item.child_id === childId
          ? normalizeSponsorshipItem({ ...item, monthly_amount: Number(amount) })
          : item,
      ),
    }));
  }, []);
  const removeFromCart = useCallback(
    (childId) =>
      setCart((cart) => ({
        ...cart,
        items: cart.items.filter((item) => item.child_id !== childId),
      })),
    [],
  );
  const clearCart = useCallback(
    () => setCart((cart) => ({ ...cart, items: [] })),
    [],
  );
  const isInCart = useCallback(
    (childId) => cartItems.some((item) => item.child_id === childId),
    [cartItems],
  );
  const subtotal = useMemo(
    () => getSponsorshipSubtotal(cartItems),
    [cartItems],
  );
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((open) => !open), []);
  const value = useMemo(
    () => ({
      cartItems,
      cartCount: cartItems.length,
      subtotal,
      frequency,
      setFrequency,
      loaded,
      isCartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      setItemPlan,
      setItemMonthlyAmount,
      isInCart,
      openCart,
      closeCart,
      toggleCart,
    }),
    [
      cartItems,
      subtotal,
      frequency,
      setFrequency,
      loaded,
      isCartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      setItemPlan,
      setItemMonthlyAmount,
      isInCart,
      openCart,
      closeCart,
      toggleCart,
    ],
  );

  return (
    <SponsorshipCartContext.Provider value={value}>
      {children}
    </SponsorshipCartContext.Provider>
  );
}

export function useSponsorshipCart() {
  const context = useContext(SponsorshipCartContext);
  if (!context)
    throw new Error(
      "useSponsorshipCart must be used within a SponsorshipCartProvider",
    );
  return context;
}
