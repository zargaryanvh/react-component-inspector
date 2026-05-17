// Main exports
export { InspectionProvider, useInspection } from './InspectionContext';
export type { ComponentMetadata } from './InspectionContext';
export { InspectionTooltip } from './InspectionTooltip';
export { InspectionHighlight } from './InspectionHighlight';
export { InspectionOverlays } from './InspectionOverlays';
export { InspectionWrapper, withInspection } from './InspectionWrapper';
export { useInspectionMetadata } from './useInspectionMetadata';
export { setupInterceptors, setInspectionActive, shouldBlockRequest } from './inspectionInterceptors';
export { 
  generateComponentId, 
  formatPropsSignature, 
  formatMetadataForClipboard,
  formatMarginForClipboard,
  formatPaddingForClipboard,
  formatGapForClipboard,
  getParentWithGap,
  getAncestorsWithMargin,
  getTooltipHowToFindInfo,
  getComponentName,
  getNextInstanceIndex
} from './inspection';
export type { CopyType } from './inspection';
export { setupAutoInspection, parseInspectionMetadata } from './autoInspection';
