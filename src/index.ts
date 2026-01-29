// Main exports
export { InspectionProvider, useInspection, ComponentMetadata } from './InspectionContext';
export { InspectionTooltip } from './InspectionTooltip';
export { InspectionHighlight } from './InspectionHighlight';
export { InspectionWrapper, withInspection } from './InspectionWrapper';
export { useInspectionMetadata } from './useInspectionMetadata';
export { setupInterceptors, setInspectionActive, shouldBlockRequest } from './inspectionInterceptors';
export { 
  generateComponentId, 
  formatPropsSignature, 
  formatMetadataForClipboard,
  getComponentName,
  getNextInstanceIndex
} from './inspection';
export { setupAutoInspection, parseInspectionMetadata } from './autoInspection';
