/**
 * Automatic inspection detection via data attributes
 * Components can add data-inspection-* attributes and the system will detect them automatically
 */

import { ComponentMetadata } from "./InspectionContext";

/**
 * Extract basic element info for inspection
 */
const extractElementInfo = (element: HTMLElement): {
  tagName: string;
  className: string;
  id: string;
  textPreview: string;
  muiComponent?: string;
} => {
  const tagName = element.tagName.toLowerCase();
  // Convert className to string - it can be a DOMTokenList or string
  let className = "";
  if (typeof element.className === "string") {
    className = element.className;
  } else if (element.className) {
    // DOMTokenList - convert to string
    className = String(element.className);
  }
  const id = element.id || "";
  
  // Extract text preview (first 50 chars)
  const textContent = element.textContent || "";
  const textPreview = textContent.trim().substring(0, 50).replace(/\s+/g, " ");
  
  // Try to detect MUI components from class names
  let muiComponent: string | undefined;
  if (className && typeof className === "string" && className.includes("Mui")) {
    const muiMatch = className.match(/Mui(\w+)/);
    if (muiMatch) {
      muiComponent = muiMatch[1];
    }
  }
  
  return { tagName, className, id, textPreview, muiComponent };
};

/**
 * Parse component metadata from data attributes or infer from element
 */
export const parseInspectionMetadata = (element: HTMLElement): ComponentMetadata | null => {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // First, try to find explicit inspection metadata
  const componentName = element.getAttribute("data-inspection-name");
  const componentId = element.getAttribute("data-inspection-id");
  
  if (componentName && componentId) {
    // Has explicit metadata - use it
    const variant = element.getAttribute("data-inspection-variant") || undefined;
    const role = element.getAttribute("data-inspection-role") || undefined;
    const usagePath = element.getAttribute("data-inspection-usage-path") || "Unknown";
    const instanceIndex = parseInt(element.getAttribute("data-inspection-instance") || "0", 10);
    const propsSignature = element.getAttribute("data-inspection-props") || "default";
    const sourceFile = element.getAttribute("data-inspection-file") || "Unknown";

    return {
      componentName,
      componentId,
      variant,
      role,
      usagePath,
      instanceIndex,
      propsSignature,
      sourceFile,
    };
  }

  // No explicit metadata - infer from element
  const info = extractElementInfo(element);
  
  // Generate component name
  let inferredName = info.muiComponent || info.tagName.toUpperCase();
  if (info.id) {
    inferredName = `${inferredName} (${info.id})`;
  } else if (info.className) {
    // Try to extract meaningful class name
    const classes = info.className.split(/\s+/).filter(c => 
      c && !c.startsWith("Mui") && c.length > 2
    );
    if (classes.length > 0) {
      inferredName = `${inferredName} .${classes[0]}`;
    }
  }
  
  // Generate component ID - use deterministic hash based on element's position in DOM tree
  // This ensures the same element always gets the same ID, even without explicit metadata
  const generateDeterministicId = (el: HTMLElement, tagName: string): string => {
    if (info.id) {
      return info.id;
    }
    
    // Create a stable identifier based on element's path in DOM tree
    const path: string[] = [];
    let current: HTMLElement | null = el;
    
    // Walk up to body, collecting tag names and indices
    while (current && current !== document.body && current !== document.documentElement) {
      const currentTagName = current.tagName.toLowerCase();
      const parent: HTMLElement | null = current.parentElement;
      
      if (parent) {
        // Get index among siblings with same tag name
        const siblings = Array.from(parent.children).filter(
          (child: Element) => child.tagName.toLowerCase() === currentTagName
        ) as HTMLElement[];
        const index = siblings.indexOf(current);
        path.unshift(`${currentTagName}[${index}]`);
      } else {
        path.unshift(currentTagName);
      }
      
      current = parent;
    }
    
    // Create hash from path (simple hash function)
    const pathString = path.join('>');
    let hash = 0;
    for (let i = 0; i < pathString.length; i++) {
      const char = pathString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive hex string (6 chars)
    const hashStr = Math.abs(hash).toString(36).substr(0, 6);
    return `${tagName}-${hashStr}`;
  };
  
  const inferredId = generateDeterministicId(element, info.tagName);
  
  // Build props signature from attributes
  const props: string[] = [];
  if (info.id) props.push(`id=${info.id}`);
  if (info.className) {
    const classCount = info.className.split(/\s+/).length;
    props.push(`classes=${classCount}`);
  }
  const propsSignature = props.length > 0 ? props.join(", ") : "default";
  
  return {
    componentName: inferredName,
    componentId: inferredId,
    variant: info.muiComponent ? info.muiComponent.toLowerCase() : undefined,
    role: element.getAttribute("role") || element.getAttribute("aria-label") || undefined,
    usagePath: "DOM Element",
    instanceIndex: 0,
    propsSignature,
    sourceFile: "DOM",
  };
};

/**
 * Helper function to inspect an element (used by both mouse and touch events)
 */
const inspectElement = (
  target: HTMLElement,
  isInspectionActive: boolean,
  isLocked: boolean,
  setHoveredComponent: (metadata: ComponentMetadata | null, element: HTMLElement | null) => void
) => {
  if (!isInspectionActive) {
    return;
  }

  // If locked, don't update - keep current tooltip fixed
  if (isLocked) {
    return;
  }

  if (!target || !document.body.contains(target)) {
    return;
  }

  // Always show inspection for any element (not just ones with metadata)
  // Walk up the DOM tree to find a meaningful element to inspect
  let current: HTMLElement | null = target;
  let bestElement: HTMLElement | null = null;
  let bestMetadata: ComponentMetadata | null = null;
  let elementWithExplicitMetadata: HTMLElement | null = null;
  let metadataWithExplicitId: ComponentMetadata | null = null;
  
  // Skip text nodes and very small elements
  const isMeaningfulElement = (el: HTMLElement): boolean => {
    const rect = el.getBoundingClientRect();
    // Skip elements that are too small (likely text nodes or empty spans)
    if (rect.width < 5 && rect.height < 5) {
      return false;
    }
    // Prefer elements with explicit metadata, IDs, or meaningful classes
    return !!(
      el.getAttribute("data-inspection-name") ||
      el.id ||
      el.className ||
      el.tagName !== "SPAN" && el.tagName !== "DIV"
    );
  };
  
  // First pass: Look for elements with explicit inspection metadata
  // This ensures we always find the same component regardless of which child is hovered
  while (current) {
    // Ensure element is still in the DOM
    if (!document.body.contains(current)) {
      break;
    }
    
    // Check if this element has explicit inspection metadata
    const hasExplicitMetadata = current.getAttribute("data-inspection-name") && 
                                 current.getAttribute("data-inspection-id");
    
    if (hasExplicitMetadata) {
      const metadata = parseInspectionMetadata(current);
      if (metadata) {
        elementWithExplicitMetadata = current;
        metadataWithExplicitId = metadata;
        break; // Found explicit metadata, use it
      }
    }
    
    current = current.parentElement;
    
    // Stop at body to avoid inspecting the entire page
    if (current && (current.tagName === "BODY" || current.tagName === "HTML")) {
      break;
    }
  }
  
  // If we found explicit metadata, use it (this ensures consistent IDs)
  if (elementWithExplicitMetadata && metadataWithExplicitId) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Inspection] Found element with explicit metadata:", metadataWithExplicitId.componentName);
    }
    setHoveredComponent(metadataWithExplicitId, elementWithExplicitMetadata);
    return;
  }
  
  // Second pass: If no explicit metadata found, look for meaningful elements
  // Reset current to target for second pass
  current = target;
  
  while (current) {
    // Ensure element is still in the DOM
    if (!document.body.contains(current)) {
      break;
    }
    
    // Check if this is a meaningful element
    if (isMeaningfulElement(current)) {
      const metadata = parseInspectionMetadata(current);
      if (metadata) {
        // Keep the first meaningful element (closest to target)
        if (!bestElement) {
          bestElement = current;
          bestMetadata = metadata;
        }
      }
    }
    
    current = current.parentElement;
    
    // Stop at body to avoid inspecting the entire page
    if (current && (current.tagName === "BODY" || current.tagName === "HTML")) {
      break;
    }
  }
  
  if (bestElement && bestMetadata) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Inspection] Found element:", bestMetadata.componentName);
    }
    setHoveredComponent(bestMetadata, bestElement);
  } else {
    // Fallback: show info for the target element itself
    const fallbackMetadata = parseInspectionMetadata(target);
    if (fallbackMetadata) {
      setHoveredComponent(fallbackMetadata, target);
    } else {
      setHoveredComponent(null, null);
    }
  }
};

/**
 * Setup global mouse event listener for automatic inspection detection
 * This works with components that have data-inspection-* attributes
 */
export const setupAutoInspection = (
  setHoveredComponent: (metadata: ComponentMetadata | null, element: HTMLElement | null) => void,
  isInspectionActive: boolean,
  isLocked: boolean
): (() => void) => {
  if (process.env.NODE_ENV !== "development") {
    return () => {}; // No-op in production
  }

  // Detect if device supports touch
  const isTouchDevice = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isInspectionActive) {
      return;
    }

    // If locked, don't update on mouse move - keep current tooltip fixed
    if (isLocked) {
      return;
    }

    const target = e.target as HTMLElement;
    inspectElement(target, isInspectionActive, isLocked, setHoveredComponent);
  };

  // Touch move handler for mobile devices
  const handleTouchMove = (e: TouchEvent) => {
    // Only process if inspection is active and we have touches
    if (!isInspectionActive || e.touches.length === 0) {
      return;
    }

    // Get the element under the first touch point
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    
    if (target) {
      inspectElement(target, isInspectionActive, isLocked, setHoveredComponent);
    }
  };

  // Touch start handler for mobile - inspect on touch
  const handleTouchStart = (e: TouchEvent) => {
    // Only process if inspection is active and we have touches
    // Skip if it's a 3-finger touch (used for activation)
    if (!isInspectionActive || e.touches.length === 3) {
      return;
    }

    // Get the element under the first touch point
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    
    if (target) {
      inspectElement(target, isInspectionActive, isLocked, setHoveredComponent);
    }
  };

  const handleMouseLeave = () => {
    if (isInspectionActive && !isLocked) {
      setHoveredComponent(null, null);
    }
  };

  const handleTouchEnd = () => {
    // Clear inspection on touch end (unless locked)
    if (isInspectionActive && !isLocked) {
      setHoveredComponent(null, null);
    }
  };

  // Add mouse event listeners
  window.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseleave", handleMouseLeave);

  // Add touch event listeners for mobile devices
  if (isTouchDevice) {
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
  }

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseleave", handleMouseLeave);
    
    if (isTouchDevice) {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    }
  };
};
