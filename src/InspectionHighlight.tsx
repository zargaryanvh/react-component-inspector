import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useInspection } from "./InspectionContext";
import { getParentWithGap, getAncestorsWithMargin } from "./inspection";
import { parseInspectionMetadata } from "./autoInspection";

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
 * When hold CTRL+M: orange = margin, green = padding, purple = gap (hold-to-use, release to exit)
 * Otherwise: blue outline for component
 */
const stripStyle = (left: number, top: number, width: number, height: number, color: string, bg: string): React.CSSProperties => ({
  position: "fixed",
  left: `${left}px`,
  top: `${top}px`,
  width: `${Math.max(0, width)}px`,
  height: `${Math.max(0, height)}px`,
  pointerEvents: "none",
  border: `2px solid ${color}`,
  backgroundColor: bg,
  boxSizing: "border-box",
});

/**
 * Clickable ancestor overlay - dashed outline, pointer-events for click-to-switch
 */
const ancestorOutlineStyle = (
  left: number,
  top: number,
  width: number,
  height: number,
  color: string,
  bg: string
): React.CSSProperties => ({
  position: "fixed",
  left: `${left}px`,
  top: `${top}px`,
  width: `${Math.max(0, width)}px`,
  height: `${Math.max(0, height)}px`,
  pointerEvents: "auto",
  cursor: "pointer",
  border: `2px dashed ${color}`,
  backgroundColor: bg,
  boxSizing: "border-box",
  zIndex: 999996,
});

export const InspectionHighlight: React.FC = () => {
  const { isInspectionActive, isMarginPaddingMode, hoveredElement, setHoveredComponent } = useInspection();
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const [marginStrips, setMarginStrips] = useState<React.CSSProperties[]>([]);
  const [paddingStrips, setPaddingStrips] = useState<React.CSSProperties[]>([]);
  const [elementOutlineStyle, setElementOutlineStyle] = useState<React.CSSProperties | null>(null);
  const [gapOutlineStyle, setGapOutlineStyle] = useState<React.CSSProperties | null>(null);
  const [ancestorOutlines, setAncestorOutlines] = useState<
    Array<{ style: React.CSSProperties; element: HTMLElement }>
  >([]);

  useEffect(() => {
    // Show when CTRL is held (inspection active)
    const shouldShow = isInspectionActive;
    if (!shouldShow) {
      setHighlightStyle(null);
      setMarginStrips([]);
      setPaddingStrips([]);
      setElementOutlineStyle(null);
      setGapOutlineStyle(null);
      setAncestorOutlines([]);
      return;
    }
    
    if (!hoveredElement) {
      setHighlightStyle(null);
      setMarginStrips([]);
      setPaddingStrips([]);
      setElementOutlineStyle(null);
      setGapOutlineStyle(null);
      setAncestorOutlines([]);
      return;
    }

    const updateHighlight = () => {
      if (!document.body.contains(hoveredElement)) {
        setHighlightStyle(null);
        setMarginStrips([]);
        setPaddingStrips([]);
        setElementOutlineStyle(null);
        setGapOutlineStyle(null);
        setAncestorOutlines([]);
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
          setMarginStrips([]);
          setPaddingStrips([]);
          setElementOutlineStyle(null);
          setGapOutlineStyle(null);
          setAncestorOutlines([]);
        } else {
          // Margin/padding mode: draw margin as 4 strips (outside), element outline, padding as 4 strips (inside)
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

          const w = rect.width;
          const h = rect.height;
          const M_ORANGE = "#e65100";
          const M_BG = "rgba(255, 152, 0, 0.4)";
          const P_GREEN = "#2e7d32";
          const P_BG = "rgba(76, 175, 80, 0.4)";

          // Element border box outline so you see the full outside size of the element
          setElementOutlineStyle({
            position: "fixed",
            left: `${left}px`,
            top: `${top}px`,
            width: `${w}px`,
            height: `${h}px`,
            pointerEvents: "none",
            zIndex: 999998,
            border: "2px solid rgba(255,255,255,0.6)",
            boxSizing: "border-box",
          });

          // Margin: 4 strips only (the actual margin space outside the element), so the outside size is visible
          const marginStripsList: React.CSSProperties[] = [];
          if (mt > 0) marginStripsList.push(stripStyle(left - ml, top - mt, w + ml + mr, mt, M_ORANGE, M_BG));
          if (mb > 0) marginStripsList.push(stripStyle(left - ml, top + h, w + ml + mr, mb, M_ORANGE, M_BG));
          if (ml > 0) marginStripsList.push(stripStyle(left - ml, top, ml, h, M_ORANGE, M_BG));
          if (mr > 0) marginStripsList.push(stripStyle(left + w, top, mr, h, M_ORANGE, M_BG));
          setMarginStrips(marginStripsList);

          // Padding: 4 strips only (the actual padding space inside the border)
          const paddingStripsList: React.CSSProperties[] = [];
          const innerLeft = left + bl;
          const innerTop = top + bt;
          const innerW = w - bl - br;
          const innerH = h - bt - bb;
          if (pt > 0) paddingStripsList.push(stripStyle(innerLeft, innerTop, innerW, pt, P_GREEN, P_BG));
          if (pb > 0) paddingStripsList.push(stripStyle(innerLeft, innerTop + innerH - pb, innerW, pb, P_GREEN, P_BG));
          if (pl > 0) paddingStripsList.push(stripStyle(innerLeft, innerTop, pl, innerH, P_GREEN, P_BG));
          if (pr > 0) paddingStripsList.push(stripStyle(innerLeft + innerW - pr, innerTop, pr, innerH, P_GREEN, P_BG));
          setPaddingStrips(paddingStripsList);

          // Gap overlay: parent with flex/grid + non-zero gap
          const parentWithGap = getParentWithGap(hoveredElement);
          if (parentWithGap && document.body.contains(parentWithGap)) {
            const pr = parentWithGap.getBoundingClientRect();
            const GAP_PURPLE = "#7b1fa2";
            const GAP_BG = "rgba(156, 39, 176, 0.2)";
            setGapOutlineStyle({
              position: "fixed",
              left: `${pr.left}px`,
              top: `${pr.top}px`,
              width: `${pr.width}px`,
              height: `${pr.height}px`,
              pointerEvents: "none",
              zIndex: 999995,
              border: "2px dashed #7b1fa2",
              backgroundColor: GAP_BG,
              boxSizing: "border-box",
            });
          } else {
            setGapOutlineStyle(null);
          }

          // Ancestor margin overlays: when current has zero margin, show ancestors with margin (clickable)
          const hasCurrentMargin = mt > 1 || mr > 1 || mb > 1 || ml > 1;
          if (!hasCurrentMargin) {
            const ancestors = getAncestorsWithMargin(hoveredElement, 2);
            const outlines = ancestors
              .filter((a) => document.body.contains(a.element))
              .map((a) => {
                const ar = a.element.getBoundingClientRect();
                return {
                  style: ancestorOutlineStyle(
                    ar.left,
                    ar.top,
                    ar.width,
                    ar.height,
                    "#e65100",
                    "rgba(255, 152, 0, 0.2)"
                  ),
                  element: a.element,
                };
              });
            setAncestorOutlines(outlines);
          } else {
            setAncestorOutlines([]);
          }
        }
      } catch (error) {
        setHighlightStyle(null);
        setMarginStrips([]);
        setPaddingStrips([]);
        setElementOutlineStyle(null);
        setGapOutlineStyle(null);
        setAncestorOutlines([]);
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

  const showContent =
    isInspectionActive &&
    (highlightStyle ||
      marginStrips.length > 0 ||
      paddingStrips.length > 0 ||
      elementOutlineStyle ||
      gapOutlineStyle ||
      ancestorOutlines.length > 0);

  if (!showContent) return null;

  const handleAncestorClick = (element: HTMLElement) => {
    const metadata = parseInspectionMetadata(element);
    if (metadata) {
      setHoveredComponent(metadata, element);
    }
  };

  return (
    <>
      {gapOutlineStyle && <Box sx={gapOutlineStyle} />}
      {ancestorOutlines.map((o, i) => (
        <Box
          key={`ancestor-${i}`}
          sx={o.style}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAncestorClick(o.element);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Click to inspect this ancestor (has margin)"
          aria-label="Ancestor with margin - click to inspect"
        />
      ))}
      {marginStrips.map((s, i) => (
        <Box key={`m-${i}`} sx={{ ...s, zIndex: 999997 }} />
      ))}
      {paddingStrips.map((s, i) => (
        <Box key={`p-${i}`} sx={{ ...s, zIndex: 999998 }} />
      ))}
      {elementOutlineStyle && <Box sx={elementOutlineStyle} />}
      {highlightStyle && <Box sx={highlightStyle} />}
    </>
  );
};
