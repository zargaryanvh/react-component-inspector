import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useInspection } from "./InspectionContext";

/**
 * Parse CSS length (e.g. "8px", "1em") to pixels
 */
const parsePx = (value: string): number => {
  if (!value || value === "0") return 0;
  const num = parseFloat(value);
  if (value.endsWith("px")) return num;
  if (value.endsWith("em") || value.endsWith("rem")) return num * 16; // approximate
  return num;
};

/**
 * Highlight overlay that shows the boundary of the hovered component
 * When hold CTRL+M: orange = margin, green = padding (hold-to-use, release to exit)
 * Otherwise: blue outline for component
 */
export const InspectionHighlight: React.FC = () => {
  const { isInspectionActive, isMarginPaddingMode, hoveredElement } = useInspection();
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const [marginStyle, setMarginStyle] = useState<React.CSSProperties | null>(null);
  const [paddingStyle, setPaddingStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    // Show when CTRL is held (inspection active)
    const shouldShow = isInspectionActive;
    if (!shouldShow) {
      setHighlightStyle(null);
      setMarginStyle(null);
      setPaddingStyle(null);
      return;
    }
    
    if (!hoveredElement) {
      setHighlightStyle(null);
      setMarginStyle(null);
      setPaddingStyle(null);
      return;
    }

    const updateHighlight = () => {
      if (!document.body.contains(hoveredElement)) {
        setHighlightStyle(null);
        setMarginStyle(null);
        setPaddingStyle(null);
        return;
      }

      try {
        const rect = hoveredElement.getBoundingClientRect();
        // position:fixed uses viewport coords - getBoundingClientRect already returns viewport coords
        const left = rect.left;
        const top = rect.top;

        // Default blue component outline
        if (!isMarginPaddingMode) {
          setHighlightStyle({
            position: "fixed",
            left: `${left}px`,
            top: `${top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            pointerEvents: "none",
            zIndex: 999998,
            border: "2px solid #2196f3",
            backgroundColor: "rgba(33, 150, 243, 0.1)",
            boxShadow: "0 0 0 1px rgba(33, 150, 243, 0.3), 0 0 8px rgba(33, 150, 243, 0.2)",
            borderRadius: "2px",
            transition: "all 0.1s ease-out",
          });
          setMarginStyle(null);
          setPaddingStyle(null);
        } else {
          // Margin/padding mode: orange margin, green padding
          setHighlightStyle(null);
          const cs = window.getComputedStyle(hoveredElement);
          const mt = parsePx(cs.marginTop);
          const mr = parsePx(cs.marginRight);
          const mb = parsePx(cs.marginBottom);
          const ml = parsePx(cs.marginLeft);
          const pt = parsePx(cs.paddingTop);
          const pr = parsePx(cs.paddingRight);
          const pb = parsePx(cs.paddingBottom);
          const pl = parsePx(cs.paddingLeft);
          const bt = parsePx(cs.borderTopWidth);
          const br = parsePx(cs.borderRightWidth);
          const bb = parsePx(cs.borderBottomWidth);
          const bl = parsePx(cs.borderLeftWidth);

          const hasMargin = mt > 0 || mr > 0 || mb > 0 || ml > 0;
          const hasPadding = pt > 0 || pr > 0 || pb > 0 || pl > 0;

          // Margin box (outside element) - orange; only show if any margin is non-zero
          if (hasMargin) {
            const mlLeft = left - ml;
            const mlTop = top - mt;
            const marginWidth = rect.width + ml + mr;
            const marginHeight = rect.height + mt + mb;
            setMarginStyle({
              position: "fixed",
              left: `${mlLeft}px`,
              top: `${mlTop}px`,
              width: `${marginWidth}px`,
              height: `${marginHeight}px`,
              pointerEvents: "none",
              zIndex: 999997,
              border: "2px solid #ff9800",
              backgroundColor: "rgba(255, 152, 0, 0.08)",
              boxShadow: "0 0 0 1px rgba(255, 152, 0, 0.4)",
              borderRadius: "2px",
              transition: "all 0.1s ease-out",
            });
          } else {
            setMarginStyle(null);
          }

          // Padding box (inside element, after border) - green; only show if any padding is non-zero
          if (hasPadding) {
            const padLeft = left + bl + pl;
            const padTop = top + bt + pt;
            const padWidth = Math.max(0, rect.width - bl - br - pl - pr);
            const padHeight = Math.max(0, rect.height - bt - bb - pt - pb);
            setPaddingStyle({
              position: "fixed",
              left: `${padLeft}px`,
              top: `${padTop}px`,
              width: `${padWidth}px`,
              height: `${padHeight}px`,
              pointerEvents: "none",
              zIndex: 999998,
              border: "2px solid #4caf50",
              backgroundColor: "rgba(76, 175, 80, 0.08)",
              boxShadow: "0 0 0 1px rgba(76, 175, 80, 0.4)",
              borderRadius: "2px",
              transition: "all 0.1s ease-out",
            });
          } else {
            setPaddingStyle(null);
          }
        }
      } catch (error) {
        setHighlightStyle(null);
        setMarginStyle(null);
        setPaddingStyle(null);
      }
    };

    updateHighlight();
    const handleUpdate = () => updateHighlight();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isInspectionActive, isMarginPaddingMode, hoveredElement]);

  const showContent = isInspectionActive && (highlightStyle || marginStyle || paddingStyle);

  if (!showContent) return null;

  return (
    <>
      {marginStyle && <Box sx={marginStyle} />}
      {paddingStyle && <Box sx={paddingStyle} />}
      {highlightStyle && <Box sx={highlightStyle} />}
    </>
  );
};
