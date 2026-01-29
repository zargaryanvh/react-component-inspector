import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Paper, Typography, IconButton, Tooltip as MuiTooltip, Divider } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useInspection, ComponentMetadata } from "./InspectionContext";
import { formatMetadataForClipboard } from "./inspection";

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
  const { isInspectionActive, isLocked, hoveredComponent, hoveredElement } = useInspection();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [stablePosition, setStablePosition] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Update position based on cursor, but keep it stable when locked or mouse is near tooltip
  useEffect(() => {
    if (!isInspectionActive || !hoveredElement) {
      setStablePosition(null);
      return;
    }

    // If locked, don't update position at all - keep it completely fixed
    if (isLocked) {
      return;
    }

    const updatePosition = (e: MouseEvent) => {
      // If we have a stable position, check if mouse is near tooltip
      if (stablePosition && tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Create a "dead zone" around tooltip (80px padding for easier clicking)
        const deadZone = {
          left: tooltipRect.left - 80,
          right: tooltipRect.right + 80,
          top: tooltipRect.top - 80,
          bottom: tooltipRect.bottom + 80,
        };
        
        // If mouse is in dead zone, keep position stable (don't update)
        if (
          mouseX >= deadZone.left &&
          mouseX <= deadZone.right &&
          mouseY >= deadZone.top &&
          mouseY <= deadZone.bottom
        ) {
          return; // Don't update position - keep it stable
        }
      }
      
      // Mouse moved far from tooltip - update position
      setPosition({ x: e.clientX, y: e.clientY });
      // Clear stable position so it recalculates
      setStablePosition(null);
    };

    window.addEventListener("mousemove", updatePosition);
    return () => window.removeEventListener("mousemove", updatePosition);
  }, [isInspectionActive, isLocked, hoveredElement, stablePosition]);

  // If no component metadata but we have an element, create basic metadata
  const displayComponent = hoveredComponent || (hoveredElement ? {
    componentName: hoveredElement.tagName.toLowerCase(),
    componentId: hoveredElement.id || "no-id",
    usagePath: "DOM Element",
    instanceIndex: 0,
    propsSignature: "default",
    sourceFile: "DOM",
  } : null);

  // Calculate adjusted position to avoid going off-screen
  // Use stable position if available, otherwise calculate from cursor position
  const adjustedPosition = useMemo(() => {
    if (!displayComponent) {
      return { x: position.x + 15, y: position.y + 15 };
    }

    // If we have a stable position, use it (don't recalculate)
    if (stablePosition) {
      return stablePosition;
    }

    // Calculate new position from cursor (only when stablePosition is null)
    const padding = 10;
    let x = position.x + 15;
    let y = position.y + 15;

    // Adjust if tooltip would go off right edge (estimate width)
    const estimatedWidth = 400; // Approximate tooltip width
    if (x + estimatedWidth > window.innerWidth - padding) {
      x = position.x - estimatedWidth - 15;
    }

    // Adjust if tooltip would go off bottom edge (estimate height)
    const estimatedHeight = 200; // Approximate tooltip height
    if (y + estimatedHeight > window.innerHeight - padding) {
      y = position.y - estimatedHeight - 15;
    }

    // Adjust if tooltip would go off left edge
    if (x < padding) {
      x = padding;
    }

    // Adjust if tooltip would go off top edge
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  }, [position, displayComponent, stablePosition]);
  
  // Set stable position once when tooltip first appears for a new element, or when locked
  const lastComponentIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentComponentId = displayComponent?.componentId || null;
    
    // When locked, ensure we have a stable position
    if (isLocked && !stablePosition && displayComponent && adjustedPosition.x > 0 && adjustedPosition.y > 0) {
      setStablePosition(adjustedPosition);
      return;
    }
    
    // Only set stable position when component changes or when we don't have one yet
    if (currentComponentId !== lastComponentIdRef.current && !stablePosition && displayComponent && adjustedPosition.x > 0 && adjustedPosition.y > 0) {
      lastComponentIdRef.current = currentComponentId;
      // Set stable position after a small delay to ensure tooltip is rendered
      const timer = setTimeout(() => {
        setStablePosition(adjustedPosition);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [displayComponent?.componentId, adjustedPosition, stablePosition, displayComponent, isLocked]);

  const handleCopy = async () => {
    if (!displayComponent || !hoveredElement) return;

    const text = formatMetadataForClipboard(displayComponent as any, hoveredElement);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Reset stable position when element changes (but not when locked)
  useEffect(() => {
    if (!isLocked) {
      setStablePosition(null);
    }
  }, [hoveredElement, isLocked]);

  // Show tooltip for any hovered element when CTRL is held
  if (!isInspectionActive || !displayComponent) {
    return null;
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
        transition: stablePosition ? "none" : "left 0.1s ease-out, top 0.1s ease-out",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600, fontSize: "0.875rem" }}>
            Component Inspector
          </Typography>
          {isLocked && (
            <Typography variant="caption" sx={{ color: "#4caf50", fontSize: "0.7rem", fontStyle: "italic" }}>
              (Locked - Release H to unlock)
            </Typography>
          )}
        </Box>
        <MuiTooltip title={copied ? "Copied!" : "Copy metadata"}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: copied ? "#4caf50" : "#fff",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              p: 0.5,
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </MuiTooltip>
      </Box>

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

        {/* Component Metadata Section */}
        <ComponentMetadataSection metadata={displayComponent} />
      </Box>
    </Paper>
  );
};
