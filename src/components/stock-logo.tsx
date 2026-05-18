"use client";

import { useState } from "react";

interface Props {
  symbol: string;
  size?: number;
  className?: string;
}

export function StockLogo({ symbol, size = 32, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`rounded-full bg-muted flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] font-bold text-muted-foreground">
          {symbol.slice(0, 2)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={`https://financialmodelingprep.com/image-stock/${symbol}.png`}
      alt={symbol}
      width={size}
      height={size}
      className={`rounded-full shrink-0 bg-muted ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
