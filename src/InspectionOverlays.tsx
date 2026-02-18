import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { InspectionTooltip } from "./InspectionTooltip";
import { InspectionHighlight } from "./InspectionHighlight";

const INSPECTOR_PORTAL_ID = "react-component-inspector-portal";

/**
 * Renders InspectionTooltip and InspectionHighlight in a dedicated portal container.
 * This avoids "removeChild" DOM errors that can occur when inspector DOM lives
 * in the same tree as the app (e.g. with MUI portals or rapid mount/unmount).
 */
export const InspectionOverlays: React.FC = () => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined" || createdRef.current) return;
    let el = document.getElementById(INSPECTOR_PORTAL_ID) as HTMLDivElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = INSPECTOR_PORTAL_ID;
      el.setAttribute("data-inspector-portal", "true");
      document.body.appendChild(el);
      createdRef.current = true;
    }
    setContainer(el);
    // Intentionally never remove the container to avoid React removeChild conflicts
  }, []);

  if (!container) return null;

  return createPortal(
    <>
      <InspectionTooltip />
      <InspectionHighlight />
    </>,
    container
  );
};
