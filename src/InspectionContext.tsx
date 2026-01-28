import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { setInspectionActive } from "./inspectionInterceptors";
import { setupAutoInspection } from "./autoInspection";

/**
 * Component inspection metadata
 */
export interface ComponentMetadata {
  componentName: string;
  componentId: string;
  variant?: string;
  role?: string;
  usagePath: string; // e.g., "ActivityPage > EditTransactionModal"
  instanceIndex: number;
  propsSignature: string; // Key props affecting behavior
  sourceFile: string; // Relative file path
}

/**
 * Inspection context state
 */
interface InspectionState {
  isInspectionActive: boolean; // CTRL is pressed
  isLocked: boolean; // CTRL+H pressed - tooltip is locked and won't update on mouse move
  hoveredComponent: ComponentMetadata | null;
  hoveredElement: HTMLElement | null;
  setHoveredComponent: (component: ComponentMetadata | null, element: HTMLElement | null) => void;
}

const InspectionContext = createContext<InspectionState | undefined>(undefined);

/**
 * Inspection Provider - Only active in development
 */
export const InspectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInspectionActive, setIsInspectionActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hoveredComponent, setHoveredComponentState] = useState<ComponentMetadata | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  // Track CTRL key state and CTRL+H for locking
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return; // Only in development
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // CTRL+H to lock tooltip position (only lock, don't toggle)
      if (e.ctrlKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        if (isInspectionActive && hoveredComponent && !isLocked) {
          setIsLocked(true);
          if (process.env.NODE_ENV === "development") {
            console.log("[Inspection] Tooltip locked - position fixed. Release CTRL to unlock.");
          }
        }
        return;
      }

      // CTRL key pressed
      if (e.key === "Control" || e.ctrlKey) {
        setIsInspectionActive(true);
        setInspectionActive(true);
        if (process.env.NODE_ENV === "development") {
          console.log("[Inspection] Activated - Hold CTRL and hover over components. Press CTRL+H to lock tooltip position.");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // CTRL key released - unlock and clear
      if (e.key === "Control" || !e.ctrlKey) {
        setIsInspectionActive(false);
        setIsLocked(false);
        setInspectionActive(false);
        setHoveredComponentState(null);
        setHoveredElement(null);
        if (process.env.NODE_ENV === "development") {
          console.log("[Inspection] Deactivated");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isInspectionActive, hoveredComponent]);

  const setHoveredComponent = useCallback((component: ComponentMetadata | null, element: HTMLElement | null) => {
    if (process.env.NODE_ENV !== "development") {
      return; // Only in development
    }
    
    // Validate element is still in DOM before setting
    if (element && !document.body.contains(element)) {
      setHoveredComponentState(null);
      setHoveredElement(null);
      return;
    }
    
    setHoveredComponentState(component);
    setHoveredElement(element);
  }, []);

  // Setup automatic inspection detection via data attributes
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const cleanup = setupAutoInspection(setHoveredComponent, isInspectionActive, isLocked);
    return cleanup;
  }, [isInspectionActive, isLocked, setHoveredComponent]);


  // Don't render provider in production
  if (process.env.NODE_ENV !== "development") {
    return <>{children}</>;
  }

  return (
    <InspectionContext.Provider
      value={{
        isInspectionActive,
        isLocked,
        hoveredComponent,
        hoveredElement,
        setHoveredComponent,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
};

/**
 * Hook to access inspection context
 */
export const useInspection = (): InspectionState => {
  const context = useContext(InspectionContext);
  if (process.env.NODE_ENV !== "development") {
    // Return dummy state in production
    return {
      isInspectionActive: false,
      isLocked: false,
      hoveredComponent: null,
      hoveredElement: null,
      setHoveredComponent: () => {},
    };
  }
  if (!context) {
    throw new Error("useInspection must be used within InspectionProvider");
  }
  return context;
};
