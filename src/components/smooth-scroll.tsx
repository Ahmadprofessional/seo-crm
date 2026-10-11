'use client';

import React from 'react';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  // Pure native scrolling — zero frame drops, zero CPU drain, instant response
  return <>{children}</>;
}
