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

export type CopyType = "component" | "margin" | "padding";

/**
 * Build element identification block (shared by component/margin/padding)
 */
const buildElementIdentification = (metadata: ComponentMetadata, element: HTMLElement): string[] => {
  const lines: string[] = [];
  lines.push(`Element Type: ${element.tagName.toLowerCase()}`);
  
  const textContent = element.textContent?.trim() || "";
  const visibleText = textContent.substring(0, 100).replace(/\s+/g, " ");
  if (visibleText) lines.push(`Element Text/Label: "${visibleText}"`);
  if (element.id) lines.push(`Element ID: ${element.id}`);
  
  if (element.className) {
    const classNameStr = typeof element.className === "string" ? element.className : String(element.className);
    const classes = classNameStr.split(/\s+/).filter(c => c && !c.startsWith("Mui")).slice(0, 5);
    if (classes.length > 0) lines.push(`Element Classes: ${classes.join(", ")}`);
  }
  
  const dataAttrs: string[] = [];
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith("data-") && !attr.name.startsWith("data-inspection-")) {
      dataAttrs.push(`${attr.name}="${attr.value}"`);
    }
  });
  if (dataAttrs.length > 0) lines.push(`Data Attributes: ${dataAttrs.slice(0, 3).join(", ")}`);
  
  const role = element.getAttribute("role") || metadata.role;
  const ariaLabel = element.getAttribute("aria-label");
  if (role) lines.push(`Role: ${role}`);
  if (ariaLabel) lines.push(`Aria Label: "${ariaLabel}"`);
  
  lines.push(`Component Name: ${metadata.componentName}`);
  lines.push(`Component ID: ${metadata.componentId}`);
  lines.push(`Source File: ${metadata.sourceFile}`);
  
  let selector = element.tagName.toLowerCase();
  if (element.id) selector = `#${element.id}`;
  else if (element.className) {
    const classNameStr = typeof element.className === "string" ? element.className : String(element.className);
    const firstClass = classNameStr.split(/\s+/).find(c => c && !c.startsWith("Mui"));
    if (firstClass) selector = `${element.tagName.toLowerCase()}.${firstClass}`;
  }
  lines.push(`CSS Selector: ${selector}`);
  return lines;
};

/**
 * Parse CSS value to get numeric part (e.g. "8px" -> "8px")
 */
const getCssValue = (value: string): string => {
  if (!value) return "0px";
  return value.trim();
};

/**
 * Format metadata for clipboard with full element details
 */
export const formatMetadataForClipboard = (metadata: ComponentMetadata, element: HTMLElement, type: CopyType = "component"): string => {
  const lines: string[] = [];
  
  // Type header - helps Cursor and user understand what is being copied
  lines.push(`=== TYPE: ${type.toUpperCase()} ===`);
  lines.push(``);
  
  if (type === "component") {
    lines.push(`=== ELEMENT IDENTIFICATION ===`);
    lines.push(...buildElementIdentification(metadata, element));
    lines.push(``);
    lines.push(`=== COMPONENT METADATA ===`);
    if (metadata.variant) lines.push(`Variant: ${metadata.variant}`);
    lines.push(`Usage Path: ${metadata.usagePath}`);
    lines.push(`Instance: ${metadata.instanceIndex}`);
    lines.push(`Props: ${metadata.propsSignature}`);
    lines.push(``);
    const rect = element.getBoundingClientRect();
    lines.push(`Position: (${Math.round(rect.left)}, ${Math.round(rect.top)})`);
    lines.push(`Size: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
  } else if (type === "margin" || type === "padding") {
    const cs = window.getComputedStyle(element);
    lines.push(`=== ELEMENT IDENTIFICATION ===`);
    lines.push(...buildElementIdentification(metadata, element));
    lines.push(``);
    
    if (type === "margin") {
      lines.push(`=== CURRENT MARGIN VALUES ===`);
      lines.push(`margin-top: ${getCssValue(cs.marginTop)}`);
      lines.push(`margin-right: ${getCssValue(cs.marginRight)}`);
      lines.push(`margin-bottom: ${getCssValue(cs.marginBottom)}`);
      lines.push(`margin-left: ${getCssValue(cs.marginLeft)}`);
      lines.push(``);
      lines.push(`=== HOW TO MODIFY MARGIN ===`);
      lines.push(`1. In CSS: target the element (e.g. #id or .class) and set margin, marginTop, marginRight, etc.`);
      lines.push(`2. In MUI sx prop: margin: 1, mt: 1, mr: 2, mb: 1, ml: 2 (theme spacing), or margin: "8px"`);
      lines.push(`3. To remove margin: margin: 0 or margin: "0"`);
      lines.push(`4. To increase: use larger values (e.g. margin: 2, mt: 3)`);
    } else {
      lines.push(`=== CURRENT PADDING VALUES ===`);
      lines.push(`padding-top: ${getCssValue(cs.paddingTop)}`);
      lines.push(`padding-right: ${getCssValue(cs.paddingRight)}`);
      lines.push(`padding-bottom: ${getCssValue(cs.paddingBottom)}`);
      lines.push(`padding-left: ${getCssValue(cs.paddingLeft)}`);
      lines.push(``);
      lines.push(`=== HOW TO MODIFY PADDING ===`);
      lines.push(`1. In CSS: target the element and set padding, paddingTop, paddingRight, etc.`);
      lines.push(`2. In MUI sx prop: padding: 1, pt: 1, pr: 2, pb: 1, pl: 2 (theme spacing), or padding: "8px"`);
      lines.push(`3. To remove padding: padding: 0 or padding: "0"`);
      lines.push(`4. To increase: use larger values (e.g. padding: 2, pt: 3)`);
    }
  }
  
  return lines.join("\n");
};

/**
 * Format margin info for clipboard (alias for formatMetadataForClipboard with type="margin")
 */
export const formatMarginForClipboard = (metadata: ComponentMetadata, element: HTMLElement): string => {
  return formatMetadataForClipboard(metadata, element, "margin");
};

/**
 * Format padding info for clipboard (alias for formatMetadataForClipboard with type="padding")
 */
export const formatPaddingForClipboard = (metadata: ComponentMetadata, element: HTMLElement): string => {
  return formatMetadataForClipboard(metadata, element, "padding");
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
