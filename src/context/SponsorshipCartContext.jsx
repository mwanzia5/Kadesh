import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { captureEvent } from "@/lib/analytics";

// Sponsorship cart — lets a donor collect several children and pay for all of
// them in one checkout on the donation page (cart + checkout, sponsorship
// style). Persisted per-device so it survives page reloads and sign-in round
// trips.
const STORAGE_KEY = "khm_sponsorship_cart";

// Rounds to 2 decimal places so sponsorship amounts can be set with cents
// (e.g. $1.50) while staying safe for payments.
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const SponsorshipCartContext = createContext(null);

export function SponsorshipCartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setCartItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCartItems([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Storage unavailable (private mode / quota) — cart still works in memory.
    }
  }, [cartItems, loaded]);

  const addToCart = useCallback((child, amount = 50) => {
    const item = {
      child_id: child.id,
      first_name: child.first_name || "Child",
      photo_url: child.photo_url || null,
      location: child.location || null,
      amount: Math.max(0.01, round2(Number(amount) || 0) || 50),
    };
    captureEvent("sponsorship_cart_added", {
      child_id: child.id,
      amount: item.amount,
    });
    setCartItems((prev) => {
      const exists = prev.some((i) => i.child_id === item.child_id);
      if (exists) {
        return prev.map((i) =>
          i.child_id === item.child_id ? { ...i, amount: item.amount } : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((childId) => {
    setCartItems((prev) => prev.filter((i) => i.child_id !== childId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const setItemAmount = useCallback((childId, amount) => {
    const next = Math.max(0, round2(amount));
    setCartItems((prev) =>
      prev.map((i) => (i.child_id === childId ? { ...i, amount: next } : i))
    );
  }, []);

  const isInCart = useCallback(
    (childId) => cartItems.some((i) => i.child_id === childId),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
    [cartItems]
  );

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      cartItems,
      cartCount: cartItems.length,
      subtotal,
      isCartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      setItemAmount,
      isInCart,
      openCart,
      closeCart,
      toggleCart,
    }),
    [
      cartItems,
      subtotal,
      isCartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      setItemAmount,
      isInCart,
      openCart,
      closeCart,
      toggleCart,
    ]
  );

  return (
    <SponsorshipCartContext.Provider value={value}>
      {children}
    </SponsorshipCartContext.Provider>
  );
}

export function useSponsorshipCart() {
  const ctx = useContext(SponsorshipCartContext);
  if (!ctx) {
    throw new Error(
      "useSponsorshipCart must be used within a SponsorshipCartProvider"
    );
  }
  return ctx;
}