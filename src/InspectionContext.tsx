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
  isInspectionActive: boolean;
  isLocked: boolean;
  isMobile: boolean; // Touch device - tooltip only shown when locked (H or double-tap)
  isMarginPaddingMode: boolean;
  hoveredComponent: ComponentMetadata | null;
  hoveredElement: HTMLElement | null;
  setHoveredComponent: (component: ComponentMetadata | null, element: HTMLElement | null) => void;
}

const InspectionContext = createContext<InspectionState | undefined>(undefined);

/**
 * Inspection Provider - Only active in development
 */
export const InspectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const [isStickyInspection, setIsStickyInspection] = useState(false);
  const isInspectionActive = ctrlHeld || isStickyInspection;
  const [isLocked, setIsLocked] = useState(false);
  const [isMarginPaddingMode, setIsMarginPaddingMode] = useState(false);
  const [hoveredComponent, setHoveredComponentState] = useState<ComponentMetadata | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  // Use refs to always access latest state values in event handlers
  const isInspectionActiveRef = useRef(isInspectionActive);
  const isLockedRef = useRef(isLocked);
  const isStickyInspectionRef = useRef(isStickyInspection);
  const hoveredComponentRef = useRef(hoveredComponent);
  const hKeyPressedRef = useRef(false);
  
  // Touch support for locking only (3/4 finger activation removed - use Ctrl+Shift+R on laptop)
  const lastTapRef = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      return 'ontouchstart' in window || 
             navigator.maxTouchPoints > 0 || 
             /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

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

  useEffect(() => {
    isStickyInspectionRef.current = isStickyInspection;
  }, [isStickyInspection]);

  // Only block API/fetch when CTRL is physically held (not when sticky inspection is on)
  useEffect(() => {
    setInspectionActive(ctrlHeld);
  }, [ctrlHeld]);

  // Mobile touch handlers for activation and locking
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return; // Only in development
    }

    // Double-tap for locking tooltip (touch devices)
    const handleTouchEnd = (e: TouchEvent) => {
      if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) return;
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        if (isInspectionActiveRef.current && hoveredComponentRef.current && !isLockedRef.current) {
          setIsLocked(true);
        } else if (isLockedRef.current) {
          setIsLocked(false);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    };

    // Keyboard: CTRL, CTRL+Shift+R (toggle inspection), CTRL+M (margin/padding), CTRL+H (lock)

    const handleKeyDown = (e: KeyboardEvent) => {
      // R key with CTRL+Shift - toggle inspection on/off (sticky, for mobile viewport on laptop)
      if (e.key && e.key.toLowerCase() === "r" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) {
          setIsStickyInspection(prev => {
            const next = !prev;
            if (!next) {
              setHoveredComponentState(null);
              setHoveredElement(null);
              setIsLocked(false);
            }
            if (process.env.NODE_ENV === "development") {
              console.log("[Inspection] Inspection toggled (Ctrl+Shift+R):", next ? "ON" : "OFF");
            }
            return next;
          });
        }
        return;
      }

      // M key with CTRL (hold) - margin/padding mode while held, inspect on mouse move
      if (e.key && e.key.toLowerCase() === "m" && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) {
          setIsMarginPaddingMode(true);
          setCtrlHeld(true);
        }
        return;
      }

      // H key pressed while CTRL is held - lock tooltip position
      if (e.key && e.key.toLowerCase() === "h" && e.ctrlKey) {
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
        setCtrlHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // H key released - unlock tooltip but keep inspection active if CTRL is still held
      if (e.key && e.key.toLowerCase() === "h") {
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

      // M key released - turn off margin/padding mode (hold-to-use, no toggle)
      if (e.key && e.key.toLowerCase() === "m") {
        setIsMarginPaddingMode(false);
      }

      // CTRL key released - clear only if not in sticky mode
      if (e.key === "Control") {
        setCtrlHeld(false);
        hKeyPressedRef.current = false;
        if (!isStickyInspectionRef.current) {
          setIsMarginPaddingMode(false);
          setIsLocked(false);
          setHoveredComponentState(null);
          setHoveredElement(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      window.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []); // Empty deps - refs handle state access

  const setHoveredComponentRef = useRef<(c: ComponentMetadata | null, e: HTMLElement | null) => void>(() => {});
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
  setHoveredComponentRef.current = setHoveredComponent;

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
        isMobile,
        isMarginPaddingMode,
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
      isMobile: false,
      isMarginPaddingMode: false,
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
