import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
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

  // Use refs to always access latest state values in event handlers
  const isInspectionActiveRef = useRef(isInspectionActive);
  const isLockedRef = useRef(isLocked);
  const hoveredComponentRef = useRef(hoveredComponent);
  const hKeyPressedRef = useRef(false); // Track if H key is currently being held

  // Keep refs in sync with state
  useEffect(() => {
    isInspectionActiveRef.current = isInspectionActive;
  }, [isInspectionActive]);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    hoveredComponentRef.current = hoveredComponent;
  }, [hoveredComponent]);

  // Track CTRL key state and CTRL+H for locking
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return; // Only in development
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // H key pressed while CTRL is held - lock tooltip position
      if (e.key.toLowerCase() === "h" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        
        // Ignore repeated keydown events (when key is held down)
        if (e.repeat) {
          return;
        }
        
        // Only lock if inspection is active, we have a hovered component, and H is not already being held
        if (isInspectionActiveRef.current && hoveredComponentRef.current && !hKeyPressedRef.current) {
          hKeyPressedRef.current = true;
          setIsLocked(true);
          if (process.env.NODE_ENV === "development") {
            console.log("[Inspection] Tooltip LOCKED - Hold H to keep locked. Release H to unlock.");
          }
        }
        return;
      }

      // CTRL key pressed
      if (e.key === "Control" && !e.repeat) {
        setIsInspectionActive(true);
        setInspectionActive(true);
        if (process.env.NODE_ENV === "development") {
          console.log("[Inspection] Activated - Hold CTRL and hover over components. Press H to lock tooltip position.");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // H key released - unlock tooltip but keep inspection active if CTRL is still held
      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        e.stopPropagation();
        
        // Only process if H was actually being held
        if (hKeyPressedRef.current) {
          const wasLocked = isLockedRef.current;
          hKeyPressedRef.current = false;
          
          // Only unlock if we were locked and CTRL is still held
          if (wasLocked && e.ctrlKey && isInspectionActiveRef.current) {
            setIsLocked(false);
            if (process.env.NODE_ENV === "development") {
              console.log("[Inspection] Tooltip UNLOCKED - inspection continues while CTRL is held.");
            }
          }
        }
        return;
      }

      // CTRL key released - unlock and clear
      if (e.key === "Control") {
        setIsInspectionActive(false);
        setIsLocked(false);
        hKeyPressedRef.current = false;
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
  }, []); // Empty deps - refs handle state access

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
