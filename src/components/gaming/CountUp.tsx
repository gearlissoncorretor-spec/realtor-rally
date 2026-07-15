import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  format?: (n: number) => string;
}

export function CountUp({ value, duration = 1200, className, style, format }: Props) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number>();

  useEffect(() => {
    from.current = display;
    startTime.current = null;
    const step = (t: number) => {
      if (startTime.current === null) startTime.current = t;
      const p = Math.min(1, (t - startTime.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from.current + (value - from.current) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const rounded = Math.round(display);
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {format ? format(rounded) : rounded.toLocaleString("pt-BR")}
    </span>
  );
}
