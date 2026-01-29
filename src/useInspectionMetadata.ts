import React, { useMemo } from "react";
import { useInspection, ComponentMetadata } from "./InspectionContext";
import {
  generateComponentId,
  formatPropsSignature,
  getNextInstanceIndex,
} from "./inspection";

/**
 * Hook to add inspection metadata to a component
 * 
 * Usage:
 * ```tsx
 * const MyComponent = (props) => {
 *   const inspectionProps = useInspectionMetadata({
 *     componentName: "MyComponent",
 *     variant: props.variant,
 *     usagePath: "ActivityPage > TransactionList",
 *     props,
 *     sourceFile: "src/components/MyComponent.tsx",
 *   });
 *   
 *   return <Box {...inspectionProps}>...</Box>;
 * };
 * ```
 */
export const useInspectionMetadata = (config: {
  componentName: string;
  variant?: string;
  role?: string;
  usagePath: string;
  props: Record<string, any>;
  sourceFile: string;
}) => {
  const { isInspectionActive, setHoveredComponent } = useInspection();
  const instanceIndex = useMemo(() => getNextInstanceIndex(config.componentName), [config.componentName]);

  const metadata = useMemo<ComponentMetadata>(() => ({
    componentName: config.componentName,
    componentId: generateComponentId(config.componentName, instanceIndex),
    variant: config.variant,
    role: config.role,
    usagePath: config.usagePath,
    instanceIndex,
    propsSignature: formatPropsSignature(config.props),
    sourceFile: config.sourceFile,
  }), [config, instanceIndex]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isInspectionActive) return;
    const target = e.currentTarget as HTMLElement;
    setHoveredComponent(metadata, target);
  };

  const handleMouseLeave = () => {
    if (!isInspectionActive) return;
    setHoveredComponent(null, null);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isInspectionActive) return;
    const target = e.currentTarget as HTMLElement;
    setHoveredComponent(metadata, target);
  };

  const handleTouchEnd = () => {
    if (!isInspectionActive) return;
    // Don't clear on touch end - let autoInspection handle it
    // This allows touch move to continue inspecting
  };

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    "data-inspection-id": metadata.componentId,
    "data-inspection-name": config.componentName,
  };
};
