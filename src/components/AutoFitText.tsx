import { useLayoutEffect, useRef, useState, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface AutoFitTextProps {
  children: React.ReactNode;
  /** Tamanho máximo da fonte em px */
  max?: number;
  /** Tamanho mínimo da fonte em px (não reduz abaixo disso) */
  min?: number;
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Texto que reduz automaticamente o font-size para caber 100% no container,
 * sem nunca cortar (sem ellipsis, sem overflow). Recalcula em resize do pai
 * e quando o conteúdo muda.
 */
const AutoFitText = ({
  children,
  max = 40,
  min = 16,
  className,
  style,
  as: Tag = "span",
}: AutoFitTextProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const node = textRef.current;
    if (!wrap || !node) return;

    const fit = () => {
      const available = wrap.clientWidth;
      if (!available) return;
      let lo = min;
      let hi = max;
      let best = min;
      // busca binária do maior tamanho que cabe
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        node.style.fontSize = `${mid}px`;
        if (node.scrollWidth <= available) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }
      node.style.fontSize = `${best}px`;
      setSize(best);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [children, max, min]);

  return (
    <div ref={wrapRef} className="w-full min-w-0">
      <Tag
        ref={textRef as React.RefObject<HTMLElement>}
        className={cn("inline-block whitespace-nowrap leading-none", className)}
        style={{ fontSize: `${size}px`, ...style }}
      >
        {children}
      </Tag>
    </div>
  );
};

export default AutoFitText;
