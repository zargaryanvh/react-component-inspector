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
  
  // Mobile touch support
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);
  const isMobileRef = useRef(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      return 'ontouchstart' in window || 
             navigator.maxTouchPoints > 0 || 
             /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    isMobileRef.current = checkMobile();
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

  // Mobile touch handlers for activation and locking
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return; // Only in development
    }

    // Long-press to activate inspection mode (mobile)
    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobileRef.current) return;
      
      // Only activate if touching with 3 fingers (to avoid accidental activation)
      if (e.touches.length === 3) {
        touchStartTimeRef.current = Date.now();
        
        longPressTimerRef.current = setTimeout(() => {
          setIsInspectionActive(true);
          setInspectionActive(true);
          if (process.env.NODE_ENV === "development") {
            console.log("[Inspection] Activated (mobile) - Long-press with 3 fingers. Double-tap tooltip to lock.");
          }
        }, 800); // 800ms long-press
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isMobileRef.current) return;
      
      // Clear long-press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Double-tap detection for locking (on tooltip or component)
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double-tap detected
        if (isInspectionActiveRef.current && hoveredComponentRef.current && !isLockedRef.current) {
          setIsLocked(true);
          if (process.env.NODE_ENV === "development") {
            console.log("[Inspection] Tooltip LOCKED (mobile) - Double-tap again to unlock.");
          }
        } else if (isLockedRef.current) {
          // Unlock on double-tap when locked
          setIsLocked(false);
          if (process.env.NODE_ENV === "development") {
            console.log("[Inspection] Tooltip UNLOCKED (mobile) - inspection continues.");
          }
        }
        lastTapRef.current = 0; // Reset
      } else {
        lastTapRef.current = now;
      }

      // Deactivate if 3-finger touch ends and inspection was active
      if (e.touches.length === 0 && isInspectionActiveRef.current) {
        const touchDuration = Date.now() - touchStartTimeRef.current;
        // Only deactivate if it was a quick tap (not a long-press that activated)
        if (touchDuration < 800) {
          setIsInspectionActive(false);
          setIsLocked(false);
          hKeyPressedRef.current = false;
          setInspectionActive(false);
          setHoveredComponentState(null);
          setHoveredElement(null);
          if (process.env.NODE_ENV === "development") {
            console.log("[Inspection] Deactivated (mobile)");
          }
        }
      }
    };

    const handleTouchCancel = () => {
      if (!isMobileRef.current) return;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    // Track CTRL key state and CTRL+H for locking (desktop)

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
    
    // Mobile touch events
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
      
      // Cleanup timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
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
