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
 * Build DOM path from body to element (helps Cursor identify exact element)
 */
const buildDomPath = (element: HTMLElement): string => {
  const segments: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const id = current.id ? `#${current.id}` : "";
    const classStr = current.className ? (typeof current.className === "string" ? current.className : String(current.className)) : "";
    const classes = classStr.split(/\s+/).filter((c) => c);
    // Prefer Mui/css- class for uniqueness; fallback to first non-Mui
    const cls = classes.find((c) => c.startsWith("Mui") || c.startsWith("css-")) || classes.find((c) => !c.startsWith("Mui")) || "";
    const part = id ? `${tag}${id}` : cls ? `${tag}.${cls}` : tag;
    segments.unshift(part);
    current = current.parentElement;
  }
  return "body > " + segments.join(" > ");
};

/**
 * Build parent element description
 */
const buildParentInfo = (element: HTMLElement): string | null => {
  const parent = element.parentElement;
  if (!parent || parent === document.body) return null;
  const tag = parent.tagName.toLowerCase();
  const id = parent.id ? `#${parent.id}` : "";
  const cls = parent.className
    ? typeof parent.className === "string"
      ? parent.className.split(/\s+/).find((c) => c && (c.startsWith("Mui") || c.startsWith("css-")))
      : ""
    : "";
  return cls ? `${tag}.${cls}` : id ? `${tag}${id}` : tag;
};

/**
 * Build role/disambiguation (outer vs inner, position in tree)
 */
const buildRoleInTree = (element: HTMLElement, type: "margin" | "padding"): string => {
  const parent = element.parentElement;
  const children = element.children;
  const childCount = Array.from(children).length;
  const cs = window.getComputedStyle(element);

  // Check if this element has children with similar padding/margin (common confusion: parent vs child)
  let similarChildren = 0;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement;
    if (child.getBoundingClientRect().width < 2 || child.getBoundingClientRect().height < 2) continue;
    const childCs = window.getComputedStyle(child);
    if (type === "padding") {
      const same =
        childCs.paddingTop === cs.paddingTop &&
        childCs.paddingBottom === cs.paddingBottom &&
        childCs.paddingLeft === cs.paddingLeft &&
        childCs.paddingRight === cs.paddingRight;
      if (same) similarChildren++;
    } else {
      const same =
        childCs.marginTop === cs.marginTop &&
        childCs.marginBottom === cs.marginBottom &&
        childCs.marginLeft === cs.marginLeft &&
        childCs.marginRight === cs.marginRight;
      if (same) similarChildren++;
    }
  }

  const parts: string[] = [];
  if (childCount > 0) parts.push(`has ${childCount} child element(s)`);
  if (similarChildren > 0)
    parts.push(`WARNING: ${similarChildren} direct child(ren) have similar ${type} - make sure you change THIS element (the parent), not a child`);
  if (parent && parent !== document.body) {
    const parentDesc = buildParentInfo(element);
    if (parentDesc) parts.push(`parent: ${parentDesc}`);
  }
  return parts.length > 0 ? parts.join("; ") : "leaf element";
};

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

    // DOM path - so Cursor sees exact hierarchy and can distinguish this element from children
    lines.push(`DOM Path: ${buildDomPath(element)}`);
    const parentInfo = buildParentInfo(element);
    if (parentInfo) lines.push(`Parent: ${parentInfo}`);
    lines.push(`Role in tree: ${buildRoleInTree(element, type)}`);
    lines.push(``);

    if (type === "margin") {
      lines.push(`=== CURRENT MARGIN VALUES ===`);
      lines.push(`margin-top: ${getCssValue(cs.marginTop)}`);
      lines.push(`margin-right: ${getCssValue(cs.marginRight)}`);
      lines.push(`margin-bottom: ${getCssValue(cs.marginBottom)}`);
      lines.push(`margin-left: ${getCssValue(cs.marginLeft)}`);
      lines.push(``);
      // TARGET line - copy-paste ready for Cursor
      lines.push(`=== TARGET (use this to instruct Cursor) ===`);
      const classNameStr = element.className ? (typeof element.className === "string" ? element.className : String(element.className)) : "";
      const firstClass = classNameStr.split(/\s+/).find((c) => c && (c.startsWith("Mui") || c.startsWith("css-")));
      const desc = firstClass ? `${metadata.componentName} with class ${firstClass}` : metadata.componentName;
      lines.push(`TARGET: The ${desc} - the element with margin ${getCssValue(cs.marginTop)} ${getCssValue(cs.marginRight)} ${getCssValue(cs.marginBottom)} ${getCssValue(cs.marginLeft)}. It is the PARENT in the DOM path above, NOT a child.`);
      lines.push(``);
      lines.push(`=== HOW TO FIND AND MODIFY MARGIN IN CODE ===`);
      lines.push(`1. Use the DOM Path to locate the correct element - do NOT change a child (e.g. CardContent, MuiBox) if the path shows this element is the parent.`);
      if (metadata.sourceFile !== "DOM") {
        lines.push(`2. Open ${metadata.sourceFile} and find the component that renders this element.`);
      } else {
        lines.push(`2. Search for the parent component that renders this layout. Look for MUI components (Box, Card, etc.) - the element with these margin values may use sx={{ m: ... }} or style props.`);
      }
      lines.push(`3. Change margin: sx={{ margin: 0 }} or margin: "4px" or mt: 1, mr: 1, mb: 1, ml: 1 (MUI theme spacing).`);
    } else {
      lines.push(`=== CURRENT PADDING VALUES ===`);
      lines.push(`padding-top: ${getCssValue(cs.paddingTop)}`);
      lines.push(`padding-right: ${getCssValue(cs.paddingRight)}`);
      lines.push(`padding-bottom: ${getCssValue(cs.paddingBottom)}`);
      lines.push(`padding-left: ${getCssValue(cs.paddingLeft)}`);
      lines.push(``);
      // TARGET line - copy-paste ready for Cursor
      lines.push(`=== TARGET (use this to instruct Cursor) ===`);
      const classNameStr = element.className ? (typeof element.className === "string" ? element.className : String(element.className)) : "";
      const firstClass = classNameStr.split(/\s+/).find((c) => c && (c.startsWith("Mui") || c.startsWith("css-")));
      const desc = firstClass ? `${metadata.componentName} with class ${firstClass}` : metadata.componentName;
      lines.push(`TARGET: The ${desc} - the element with padding ${getCssValue(cs.paddingTop)} ${getCssValue(cs.paddingRight)} ${getCssValue(cs.paddingBottom)} ${getCssValue(cs.paddingLeft)}. It is the PARENT in the DOM path above, NOT a child.`);
      lines.push(``);
      lines.push(`=== HOW TO FIND AND MODIFY PADDING IN CODE ===`);
      lines.push(`1. Use the DOM Path to locate the correct element - do NOT change a child (e.g. CardContent, MuiBox) if the path shows this element is the parent.`);
      if (metadata.sourceFile !== "DOM") {
        lines.push(`2. Open ${metadata.sourceFile} and find the component that renders this element.`);
      } else {
        lines.push(`2. Search for the parent component that renders this layout. Look for MUI components (Box, Card, CardContent, etc.) - the element with these exact padding values may use sx={{ p: ... }} or padding props.`);
      }
      lines.push(`3. Change padding: sx={{ padding: 0 }} or p: "4px" or pt: 1, pr: 1, pb: 1, pl: 1 (MUI theme spacing). To change from 16px to 4px: use p: 0.5 (4px) or padding: "4px".`);
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
