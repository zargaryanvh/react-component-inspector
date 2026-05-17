import React, { ReactElement, ComponentType } from "react";
import {
  generateComponentId,
  formatPropsSignature,
  getComponentName,
  getNextInstanceIndex,
} from "./inspection";

/**
 * Props for InspectionWrapper
 */
interface InspectionWrapperProps {
  componentName: string;
  variant?: string;
  role?: string;
  usagePath: string;
  props: Record<string, any>;
  sourceFile: string;
  children: ReactElement;
}

/**
 * Wrapper component that adds inspection metadata to a component
 */
export const InspectionWrapper: React.FC<InspectionWrapperProps> = ({
  componentName,
  variant,
  role,
  usagePath,
  props,
  sourceFile,
  children,
}) => {
  const instanceIndex = React.useMemo(() => getNextInstanceIndex(componentName), [componentName]);

  // Attach data-inspection-* attributes only; the global autoInspection mousemove
  // handler is the single source of truth for hover tracking. This avoids the
  // border flicker caused by competing mouseEnter/mouseLeave handlers firing
  // back and forth when the cursor sits on the edge between two components.
  if (!React.isValidElement(children)) {
    return <>{children}</>;
  }

  const componentId = generateComponentId(componentName, instanceIndex);
  const propsSignature = formatPropsSignature(props);

  const dataAttrs: Record<string, string> = {
    "data-inspection-id": componentId,
    "data-inspection-name": componentName,
    "data-inspection-usage-path": usagePath,
    "data-inspection-instance": String(instanceIndex),
    "data-inspection-props": propsSignature,
    "data-inspection-file": sourceFile,
  };
  if (variant) dataAttrs["data-inspection-variant"] = variant;
  if (role) dataAttrs["data-inspection-role"] = role;

  return <>{React.cloneElement(children, dataAttrs as any)}</>;
};

/**
 * HOC to wrap a component with inspection capabilities
 */
export function withInspection<P extends object>(
  Component: ComponentType<P>,
  inspectionConfig: {
    componentName: string;
    variant?: string;
    role?: string;
    getUsagePath: (props: P) => string;
    getSourceFile: () => string;
  }
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const usagePath = inspectionConfig.getUsagePath(props);
    const sourceFile = inspectionConfig.getSourceFile();

    return (
      <InspectionWrapper
        componentName={inspectionConfig.componentName}
        variant={inspectionConfig.variant}
        role={inspectionConfig.role}
        usagePath={usagePath}
        props={props as Record<string, any>}
        sourceFile={sourceFile}
      >
        <Component {...props} />
      </InspectionWrapper>
    );
  };

  WrappedComponent.displayName = `withInspection(${getComponentName(Component)})`;

  return WrappedComponent;
}
