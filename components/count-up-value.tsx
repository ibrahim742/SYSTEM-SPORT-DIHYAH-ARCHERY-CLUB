"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

type CountUpValueProps = {
  value: string;
  className?: string;
  durationMs?: number;
};

function parseValue(value: string) {
  const match = value.match(/-?\d[\d,.]*/);
  if (!match) return null;

  const rawNumber = match[0];
  const normalized = rawNumber.replace(/,/g, "");
  const end = Number(normalized);
  if (!Number.isFinite(end)) return null;

  return {
    decimals: normalized.includes(".") ? normalized.split(".")[1]?.length ?? 0 : 0,
    end,
    prefix: value.slice(0, match.index),
    suffix: value.slice((match.index ?? 0) + rawNumber.length)
  };
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function CountUpValue({ value, className, durationMs = 1200 }: CountUpValueProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReducedMotion = useReducedMotion();
  const parsed = useMemo(() => parseValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(parsed ? 0 : null);

  useEffect(() => {
    if (!parsed) return;
    setDisplayValue(0);
  }, [parsed]);

  useEffect(() => {
    if (!isInView || !parsed) return;

    if (prefersReducedMotion) {
      setDisplayValue(parsed.end);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setDisplayValue(parsed.end * easeOutCubic(progress));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [durationMs, isInView, parsed, prefersReducedMotion]);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  const shown = displayValue ?? 0;
  const rounded = parsed.decimals ? shown.toFixed(parsed.decimals) : Math.round(shown).toString();

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      {rounded}
      {parsed.suffix}
    </span>
  );
}
