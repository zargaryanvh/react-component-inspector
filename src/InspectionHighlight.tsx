import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useInspection } from "./InspectionContext";

/**
 * Highlight overlay that shows the boundary of the hovered component
 * Only visible when CTRL is held and a component is hovered
 */
export const InspectionHighlight: React.FC = () => {
  const { isInspectionActive, hoveredElement } = useInspection();
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    // Show highlight for any element when CTRL is held, even without metadata
    if (!isInspectionActive) {
      setHighlightStyle(null);
      return;
    }
    
    // If no hoveredElement but inspection is active, don't show highlight
    if (!hoveredElement) {
      setHighlightStyle(null);
      return;
    }

    const updateHighlight = () => {
      // Check if element is still in the DOM
      if (!document.body.contains(hoveredElement)) {
        setHighlightStyle(null);
        return;
      }

      try {
        const rect = hoveredElement.getBoundingClientRect();
        setHighlightStyle({
          position: "fixed",
          left: `${rect.left + window.scrollX}px`,
          top: `${rect.top + window.scrollY}px`,
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
      } catch (error) {
        // Element might have been removed, clear highlight
        setHighlightStyle(null);
      }
    };

    updateHighlight();

    // Update on scroll/resize
    const handleUpdate = () => updateHighlight();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isInspectionActive, hoveredElement]);

  if (!isInspectionActive || !highlightStyle) {
    return null;
  }

  return <Box sx={highlightStyle} />;
};
