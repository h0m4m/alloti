"use client";

import { useEffect } from "react";
import { setCurrencyCode } from "@/lib/format";

export function CurrencyProvider({ currency }: { currency: string }) {
  useEffect(() => {
    setCurrencyCode(currency);
  }, [currency]);

  // Also set synchronously for SSR/initial render
  setCurrencyCode(currency);

  return null;
}
