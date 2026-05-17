import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Paper, Typography, IconButton, Tooltip as MuiTooltip, Divider } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useInspection, ComponentMetadata } from "./InspectionContext";
import { formatMetadataForClipboard, getParentWithGap, getTooltipHowToFindInfo } from "./inspection";
import { parseInspectionMetadata } from "./autoInspection";
import type { CopyType } from "./inspection";

/**
 * Helper: Clamp a tooltip rect to the viewport so it's always fully visible
 */
const clampToViewport = (x: number, y: number, w: number, h: number, padding = 10) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let cx = x;
  let cy = y;
  if (cx + w > vw - padding) cx = vw - w - padding;
  if (cy + h > vh - padding) cy = vh - h - padding;
  if (cx < padding) cx = padding;
  if (cy < padding) cy = padding;
  return { x: cx, y: cy };
};

/**
 * Helper: Get element text content (first 100 chars)
 */
const getElementText = (element: HTMLElement | null): string | null => {
  if (!element) return null;
  const textContent = element.textContent?.trim() || "";
  const visibleText = textContent.substring(0, 100).replace(/\s+/g, " ");
  return visibleText || null;
};

/**
 * Helper: Get element classes (prioritize MUI classes)
 */
const getElementClasses = (element: HTMLElement | null): string[] => {
  if (!element?.className) return [];
  
  const classNameStr = typeof element.className === "string" 
    ? element.className 
    : String(element.className);
  const classes = classNameStr.split(/\s+/).filter(c => c);
  
  // Prioritize MUI classes, then others
  const muiClasses = classes.filter(c => c.includes("Mui")).slice(0, 2);
  const otherClasses = classes.filter(c => !c.includes("Mui")).slice(0, 2);
  return [...muiClasses, ...otherClasses].slice(0, 3);
};

/**
 * Helper: Generate CSS selector for element
 */
const getElementSelector = (element: HTMLElement | null): string | null => {
  if (!element) return null;
  
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classNameStr = typeof element.className === "string" 
      ? element.className 
      : String(element.className);
    const firstClass = classNameStr.split(/\s+/).find(c => c);
    if (firstClass) {
      return `${element.tagName.toLowerCase()}.${firstClass}`;
    }
  }
  
  return element.tagName.toLowerCase();
};

/**
 * Helper: Get element position and size
 */
const getElementBounds = (element: HTMLElement | null): { position: string; size: string } | null => {
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  return {
    position: `(${Math.round(rect.left)}, ${Math.round(rect.top)})`,
    size: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
  };
};

/**
 * Section: Element Identification
 */
const ElementIdentificationSection: React.FC<{ element: HTMLElement | null; role?: string }> = ({ element, role }) => {
  const elementText = getElementText(element);
  const elementClasses = getElementClasses(element);
  const selector = getElementSelector(element);
  const bounds = getElementBounds(element);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.7rem", fontWeight: 600 }}>
        === ELEMENT IDENTIFICATION ===
      </Typography>
      
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, pl: 0.5 }}>
        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
          <strong>Element Type:</strong> {element?.tagName.toLowerCase() || "unknown"}
        </Typography>
        
        {elementText && (
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
            <strong>Element Text/Label:</strong> "{elementText}"
          </Typography>
        )}
        
        {element?.id && (
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
            <strong>Element ID:</strong> {element.id}
          </Typography>
        )}
        
        {elementClasses.length > 0 && (
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
            <strong>Element Classes:</strong> {elementClasses.join(", ")}
          </Typography>
        )}

        {role && (
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
            <strong>Role:</strong> {role}
          </Typography>
        )}

        {selector && (
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
            <strong>CSS Selector:</strong> {selector}
          </Typography>
        )}

        {bounds && (
          <>
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
              <strong>Position:</strong> {bounds.position}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
              <strong>Size:</strong> {bounds.size}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

/**
 * Section: Component Metadata
 */
const ComponentMetadataSection: React.FC<{ metadata: ComponentMetadata }> = ({ metadata }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.7rem", fontWeight: 600 }}>
        === COMPONENT METADATA ===
      </Typography>
      
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, pl: 0.5 }}>
        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
          <strong>Component Name:</strong> {metadata.componentName}
        </Typography>

        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
          <strong>Component ID:</strong> {metadata.componentId}
        </Typography>

        {metadata.variant && (
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
            <strong>Variant:</strong> {metadata.variant}
          </Typography>
        )}

        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
          <strong>Usage Path:</strong> {metadata.usagePath}
        </Typography>

        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
          <strong>Instance:</strong> {metadata.instanceIndex}
        </Typography>

        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
          <strong>Props:</strong> {metadata.propsSignature}
        </Typography>

        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
          <strong>Source File:</strong> {metadata.sourceFile}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * Inspection tooltip that shows component metadata
 * Only visible when CTRL is held and a component is hovered
 */
export const InspectionTooltip: React.FC = () => {
  const { isInspectionActive, isLocked, isMobile, isMarginPaddingMode, hoveredComponent, hoveredElement } = useInspection();
  const [stablePosition, setStablePosition] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState<CopyType | null>(null);
  const [tooltipSize, setTooltipSize] = useState<{ w: number; h: number }>({ w: 400, h: 300 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Measure tooltip size so we can clamp it to the viewport precisely
  useEffect(() => {
    if (!tooltipRef.current || typeof ResizeObserver === "undefined") return;
    const el = tooltipRef.current;
    const observer = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setTooltipSize((prev) =>
          prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height }
        );
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isInspectionActive, hoveredComponent]);

  // Reset stored cursor position when inspection turns off so we don't reuse
  // a stale value on the next activation.
  useEffect(() => {
    if (!isInspectionActive || !hoveredElement) {
      setStablePosition(null);
    }
  }, [isInspectionActive, hoveredElement]);

  // If no component metadata but we have an element, create basic metadata
  const displayComponent = hoveredComponent || (hoveredElement ? {
    componentName: hoveredElement.tagName.toLowerCase(),
    componentId: hoveredElement.id || "no-id",
    usagePath: "DOM Element",
    instanceIndex: 0,
    propsSignature: "default",
    sourceFile: "DOM",
  } : null);

  // Compute anchor position once per element change. The value is intentionally
  // NOT recomputed when tooltipSize updates (ResizeObserver may fire several
  // times as the tooltip's content renders) — recomputing on every size update
  // makes the tooltip visibly slide and shrink as it settles. Pin location is
  // chosen as: below the element if there's room, otherwise above, right, left,
  // and finally a fixed corner for elements that fill the viewport.
  const tooltipSizeRef = useRef(tooltipSize);
  tooltipSizeRef.current = tooltipSize;

  const [anchoredPosition, setAnchoredPosition] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!hoveredElement || !document.body.contains(hoveredElement)) {
      setAnchoredPosition(null);
      return;
    }
    const padding = 10;
    const gap = 8;
    const { w, h } = tooltipSizeRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = hoveredElement.getBoundingClientRect();
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = vw - rect.right;
    const spaceLeft = rect.left;
    let x: number;
    let y: number;
    if (spaceBelow >= h + gap + padding) {
      y = rect.bottom + gap;
      x = Math.min(Math.max(rect.left, padding), vw - w - padding);
    } else if (spaceAbove >= h + gap + padding) {
      y = rect.top - h - gap;
      x = Math.min(Math.max(rect.left, padding), vw - w - padding);
    } else if (spaceRight >= w + gap + padding) {
      x = rect.right + gap;
      y = Math.min(Math.max(rect.top, padding), vh - h - padding);
    } else if (spaceLeft >= w + gap + padding) {
      x = rect.left - w - gap;
      y = Math.min(Math.max(rect.top, padding), vh - h - padding);
    } else {
      const cx = (rect.left + rect.right) / 2;
      const cy = (rect.top + rect.bottom) / 2;
      x = cx < vw / 2 ? vw - w - padding : padding;
      y = cy < vh / 2 ? vh - h - padding : padding;
    }
    setAnchoredPosition(clampToViewport(x, y, w, h));
  }, [hoveredElement]);

  const positionFromElement = anchoredPosition;

  // Position is anchored to the hovered element's rect, not the cursor. This
  // keeps the tooltip static while the cursor moves around inside one element
  // (e.g. when inspecting a large container) and only repositions when the
  // hovered element changes.
  const adjustedPosition = useMemo(() => {
    const w = tooltipSize.w;
    const h = tooltipSize.h;
    if (positionFromElement) return positionFromElement;
    return clampToViewport(15, 15, w, h);
  }, [positionFromElement, tooltipSize]);
  
  // When the lock is engaged we freeze whatever position was being shown at
  // that moment so it doesn't follow subsequent element changes.
  useEffect(() => {
    if (isLocked && !stablePosition && adjustedPosition.x > 0 && adjustedPosition.y > 0) {
      setStablePosition(adjustedPosition);
    }
    if (!isLocked && stablePosition) {
      setStablePosition(null);
    }
  }, [isLocked, adjustedPosition, stablePosition]);

  const fallbackCopy = (text: string): boolean => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Must be in viewport and focusable for iOS/mobile to allow copy
    textarea.style.position = "fixed";
    textarea.style.left = "0";
    textarea.style.top = "0";
    textarea.style.width = "2em";
    textarea.style.height = "2em";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.opacity = "0";
    textarea.style.zIndex = "-1";
    textarea.setAttribute("readonly", "");
    textarea.setAttribute("aria-hidden", "true");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      // ignore
    }
    document.body.removeChild(textarea);
    return ok;
  };

  const handleCopy = (type: CopyType) => {
    if (!hoveredElement) return;
    if (type === "gap") {
      const parentWithGap = getParentWithGap(hoveredElement);
      if (!parentWithGap) return;
      const metadata = parseInspectionMetadata(parentWithGap);
      if (!metadata) return;
      const text = formatMetadataForClipboard(metadata, parentWithGap, "gap");
      const showCopied = () => {
        setCopied("gap");
        setTimeout(() => setCopied(null), 2000);
      };
      const useFallbackFirst = isMobile || ("ontouchstart" in window);
      if (useFallbackFirst) {
        if (fallbackCopy(text)) showCopied();
        else if (typeof navigator.clipboard?.writeText === "function") {
          navigator.clipboard.writeText(text).then(showCopied, () => {});
        }
      } else if (typeof navigator.clipboard?.writeText === "function") {
        navigator.clipboard.writeText(text).then(showCopied, () => {
          if (fallbackCopy(text)) showCopied();
        });
      } else {
        if (fallbackCopy(text)) showCopied();
      }
      return;
    }
    if (!displayComponent) return;
    const text = formatMetadataForClipboard(displayComponent as ComponentMetadata, hoveredElement, type);
    const showCopied = () => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    };

    // On mobile, execCommand('copy') is more reliable when run directly from the tap
    const useFallbackFirst = isMobile || ("ontouchstart" in window);
    if (useFallbackFirst) {
      if (fallbackCopy(text)) showCopied();
      else if (typeof navigator.clipboard?.writeText === "function") {
        navigator.clipboard.writeText(text).then(showCopied, () => {});
      }
    } else if (typeof navigator.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(text).then(showCopied, () => {
        if (fallbackCopy(text)) showCopied();
      });
    } else {
      if (fallbackCopy(text)) showCopied();
    }
  };

  // Reset stable position when element changes (but not when locked)
  useEffect(() => {
    if (!isLocked) {
      setStablePosition(null);
    }
  }, [hoveredElement, isLocked]);

  const parentWithGap = hoveredElement ? getParentWithGap(hoveredElement) : null;

  // Show tooltip when inspection active; on mobile only when locked (H pressed or double-tap)
  if (!isInspectionActive || !displayComponent) {
    return null;
  }
  if (isMobile && !isLocked) {
    return null; // On mobile: tooltip only when user locks (H key or double-tap)
  }

  return (
    <Paper
      ref={tooltipRef}
      elevation={8}
      sx={{
        position: "fixed",
        left: stablePosition?.x ?? adjustedPosition.x,
        top: stablePosition?.y ?? adjustedPosition.y,
        zIndex: 999999,
        minWidth: 300,
        maxWidth: 500,
        p: 1.5,
        pointerEvents: "auto",
        backgroundColor: "rgba(18, 18, 18, 0.95)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        transition: "none",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600, fontSize: "0.875rem" }}>
            Component Inspector
          </Typography>
          {isMarginPaddingMode && (
            <Typography variant="caption" sx={{ color: "#ff9800", fontSize: "0.65rem" }}>
              M/P mode
            </Typography>
          )}
          {isLocked && (
            <Typography variant="caption" sx={{ color: "#4caf50", fontSize: "0.7rem", fontStyle: "italic" }}>
              (Locked - Release H to unlock)
            </Typography>
          )}
        </Box>
        {/* Copy: Component icon + Margin / Padding / Gap buttons (desktop and mobile) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <MuiTooltip title={copied === "component" ? "Copied!" : "Copy component"}>
            <IconButton
              size="small"
              onClick={(e) => { e.preventDefault(); handleCopy("component"); }}
              onPointerDown={(e) => { e.preventDefault(); handleCopy("component"); }}
              sx={{
                color: copied === "component" ? "#4caf50" : "#fff",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                p: 0.5,
                minWidth: 36,
                minHeight: 36,
              }}
              aria-label="Copy component"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <Typography
              component="button"
              type="button"
              variant="caption"
              onClick={(e) => { e.preventDefault(); handleCopy("margin"); }}
              onPointerDown={(e) => { e.preventDefault(); handleCopy("margin"); }}
              sx={{
                color: copied === "margin" ? "#4caf50" : "rgba(255,255,255,0.9)",
                fontSize: isMobile ? "0.65rem" : "0.7rem",
                cursor: "pointer",
                background: "none",
                border: "none",
                borderRight: "1px solid rgba(255,255,255,0.25)",
                padding: "4px 6px",
                fontFamily: "inherit",
                minWidth: 44,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              }}
            >
              Margin
            </Typography>
            <Typography
              component="button"
              type="button"
              variant="caption"
              onClick={(e) => { e.preventDefault(); handleCopy("padding"); }}
              onPointerDown={(e) => { e.preventDefault(); handleCopy("padding"); }}
              sx={{
                color: copied === "padding" ? "#4caf50" : "rgba(255,255,255,0.9)",
                fontSize: isMobile ? "0.65rem" : "0.7rem",
                cursor: "pointer",
                background: "none",
                border: "none",
                borderRight: parentWithGap ? "1px solid rgba(255,255,255,0.25)" : "none",
                padding: "4px 6px",
                fontFamily: "inherit",
                minWidth: 44,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              }}
            >
              Padding
            </Typography>
            {parentWithGap && (
              <Typography
                component="button"
                type="button"
                variant="caption"
                onClick={(e) => { e.preventDefault(); handleCopy("gap"); }}
                onPointerDown={(e) => { e.preventDefault(); handleCopy("gap"); }}
                sx={{
                  color: copied === "gap" ? "#4caf50" : "rgba(156, 39, 176, 0.95)",
                  fontSize: isMobile ? "0.65rem" : "0.7rem",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: "4px 6px",
                  fontFamily: "inherit",
                  minWidth: 44,
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                }}
              >
                Gap
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* When in margin/padding mode: show legend so user knows which highlight is which */}
      {isMarginPaddingMode && hoveredElement && (() => {
        try {
          const cs = window.getComputedStyle(hoveredElement);
          const mt = cs.marginTop;
          const mr = cs.marginRight;
          const mb = cs.marginBottom;
          const ml = cs.marginLeft;
          const pt = cs.paddingTop;
          const pr = cs.paddingRight;
          const pb = cs.paddingBottom;
          const pl = cs.paddingLeft;
          return (
            <Box sx={{ mb: 1, p: 0.75, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "rgba(255,255,255,0.95)", display: "block", mb: 0.5 }}>
                Highlight legend
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "2px", backgroundColor: "rgba(255, 152, 0, 0.5)", border: "1px solid #e65100" }} />
                  <Typography variant="caption" sx={{ color: "#ff9800", fontSize: "0.7rem" }}>Margin</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>(outside)</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "2px", backgroundColor: "rgba(76, 175, 80, 0.5)", border: "1px solid #2e7d32" }} />
                  <Typography variant="caption" sx={{ color: "#4caf50", fontSize: "0.7rem" }}>Padding</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>(inside)</Typography>
                </Box>
                {parentWithGap && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: "2px", backgroundColor: "rgba(156, 39, 176, 0.4)", border: "1px dashed #7b1fa2" }} />
                    <Typography variant="caption" sx={{ color: "#9c27b0", fontSize: "0.7rem" }}>Gap</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>(parent)</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 1.5, mt: 0.5, flexWrap: "wrap" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}>
                  <strong>Margin:</strong> {mt} {mr} {mb} {ml}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}>
                  <strong>Padding:</strong> {pt} {pr} {pb} {pl}
                </Typography>
              </Box>
              {(mt === "0px" || parseFloat(mt) === 0) &&
               (mr === "0px" || parseFloat(mr) === 0) &&
               (mb === "0px" || parseFloat(mb) === 0) &&
               (ml === "0px" || parseFloat(ml) === 0) && (
                <Typography variant="caption" sx={{ color: "#ff9800", fontSize: "0.6rem", display: "block", mt: 0.5 }}>
                  No margin on this element. Dashed orange outlines = ancestors with margin. Click one to inspect.
                </Typography>
              )}
            </Box>
          );
        } catch {
          return (
            <Box sx={{ mb: 1, p: 0.75, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.06)" }}>
              <Typography variant="caption" sx={{ color: "#ff9800" }}>Orange = Margin (outside)</Typography>
              <Typography variant="caption" sx={{ color: "#4caf50", display: "block" }}>Green = Padding (inside)</Typography>
            </Box>
          );
        }
      })()}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {/* Component Name Header */}
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 500, mb: 0.5 }}>
          {displayComponent.componentName}
        </Typography>

        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", my: 0.5 }} />

        {/* Element Identification Section */}
        <ElementIdentificationSection 
          element={hoveredElement} 
          role={displayComponent.role}
        />

        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", my: 0.5 }} />

        {/* How to find - same for desktop and mobile */}
        {hoveredElement && (() => {
          const howToType: CopyType = isMarginPaddingMode ? "margin" : "component";
          const info = getTooltipHowToFindInfo(displayComponent as ComponentMetadata, hoveredElement, howToType);
          return (
            <>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.7rem", fontWeight: 600 }}>
                === HOW TO FIND IN CODE ===
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, pl: 0.5 }}>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.65rem", wordBreak: "break-all" }}>
                  <strong>DOM Path:</strong> {info.domPath}
                </Typography>
                {info.parent && (
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.65rem" }}>
                    <strong>Parent:</strong> {info.parent}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.65rem" }}>
                  <strong>Role in tree:</strong> {info.roleInTree}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.65rem", mt: 0.5 }}>
                  <strong>TARGET:</strong> {info.target}
                </Typography>
                <Box component="ol" sx={{ m: 0, pl: 1.5, fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.7)" }}>
                  {info.howToFindSteps.map((step, i) => (
                    <Typography key={i} component="li" variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.65rem", mb: 0.25 }}>
                      {step}
                    </Typography>
                  ))}
                </Box>
              </Box>
              <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", my: 0.5 }} />
            </>
          );
        })()}

        {/* Component Metadata Section */}
        <ComponentMetadataSection metadata={displayComponent} />
      </Box>
    </Paper>
  );
};
