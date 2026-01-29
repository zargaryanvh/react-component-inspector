import { ComponentMetadata } from "./InspectionContext";

/**
 * Generate a unique component ID
 */
export const generateComponentId = (componentName: string, instanceIndex: number): string => {
  return `${componentName.toLowerCase().replace(/\s+/g, "-")}-${instanceIndex}`;
};

/**
 * Format props signature for display
 */
export const formatPropsSignature = (props: Record<string, any>): string => {
  const keyProps: string[] = [];
  
  // Include props that affect behavior/rendering
  const importantProps = ["variant", "role", "type", "mode", "status", "disabled", "selected", "active"];
  
  for (const key of importantProps) {
    if (key in props && props[key] !== undefined && props[key] !== null) {
      const value = props[key];
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        keyProps.push(`${key}=${String(value)}`);
      }
    }
  }
  
  return keyProps.length > 0 ? keyProps.join(", ") : "default";
};

/**
 * Get component name from component type
 */
export const getComponentName = (component: React.ComponentType<any> | string): string => {
  if (typeof component === "string") {
    return component;
  }
  return component.displayName || component.name || "Unknown";
};

/**
 * Build usage path from component hierarchy
 */
export const buildUsagePath = (hierarchy: string[]): string => {
  return hierarchy.join(" > ");
};

/**
 * Format metadata for clipboard with full element details
 */
export const formatMetadataForClipboard = (metadata: ComponentMetadata, element: HTMLElement): string => {
  const lines: string[] = [];
  
  // Element identification (most important for AI understanding)
  lines.push(`=== ELEMENT IDENTIFICATION ===`);
  lines.push(`Element Type: ${element.tagName.toLowerCase()}`);
  
  // Get element text content (label/button text)
  const textContent = element.textContent?.trim() || "";
  const visibleText = textContent.substring(0, 100).replace(/\s+/g, " ");
  if (visibleText) {
    lines.push(`Element Text/Label: "${visibleText}"`);
  }
  
  // Element ID (if exists)
  if (element.id) {
    lines.push(`Element ID: ${element.id}`);
  }
  
  // Element classes (first few meaningful ones)
  if (element.className) {
    // Convert className to string - it can be a DOMTokenList or string
    const classNameStr = typeof element.className === "string" 
      ? element.className 
      : String(element.className);
    const classes = classNameStr.split(/\s+/).filter(c => c && !c.startsWith("Mui")).slice(0, 5);
    if (classes.length > 0) {
      lines.push(`Element Classes: ${classes.join(", ")}`);
    }
  }
  
  // Data attributes that might help identify the element
  const dataAttrs: string[] = [];
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith("data-") && !attr.name.startsWith("data-inspection-")) {
      dataAttrs.push(`${attr.name}="${attr.value}"`);
    }
  });
  if (dataAttrs.length > 0) {
    lines.push(`Data Attributes: ${dataAttrs.slice(0, 3).join(", ")}`);
  }
  
  // Role/aria-label for accessibility
  const role = element.getAttribute("role") || metadata.role;
  const ariaLabel = element.getAttribute("aria-label");
  if (role) {
    lines.push(`Role: ${role}`);
  }
  if (ariaLabel) {
    lines.push(`Aria Label: "${ariaLabel}"`);
  }
  
  // Component metadata
  lines.push(``);
  lines.push(`=== COMPONENT METADATA ===`);
  lines.push(`Component Name: ${metadata.componentName}`);
  lines.push(`Component ID: ${metadata.componentId}`);
  if (metadata.variant) {
    lines.push(`Variant: ${metadata.variant}`);
  }
  lines.push(`Usage Path: ${metadata.usagePath}`);
  lines.push(`Instance: ${metadata.instanceIndex}`);
  lines.push(`Props: ${metadata.propsSignature}`);
  lines.push(`Source File: ${metadata.sourceFile}`);
  
  // CSS selector for direct targeting
  lines.push(``);
  lines.push(`=== CSS SELECTOR ===`);
  let selector = element.tagName.toLowerCase();
  if (element.id) {
    selector = `#${element.id}`;
  } else if (element.className) {
    // Convert className to string - it can be a DOMTokenList or string
    const classNameStr = typeof element.className === "string" 
      ? element.className 
      : String(element.className);
    const firstClass = classNameStr.split(/\s+/).find(c => c && !c.startsWith("Mui"));
    if (firstClass) {
      selector = `${element.tagName.toLowerCase()}.${firstClass}`;
    }
  }
  lines.push(`Selector: ${selector}`);
  
  // Visual description
  const rect = element.getBoundingClientRect();
  lines.push(`Position: (${Math.round(rect.left)}, ${Math.round(rect.top)})`);
  lines.push(`Size: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
  
  return lines.join("\n");
};

/**
 * Track component instances for instance indexing
 */
const componentInstanceCounts = new Map<string, number>();

/**
 * Get next instance index for a component
 */
export const getNextInstanceIndex = (componentName: string): number => {
  const current = componentInstanceCounts.get(componentName) || 0;
  componentInstanceCounts.set(componentName, current + 1);
  return current;
};

/**
 * Reset instance counts (useful for testing or remounting)
 */
export const resetInstanceCounts = (): void => {
  componentInstanceCounts.clear();
};
