import React, { useRef, ReactElement, ComponentType } from "react";
import { useInspection, ComponentMetadata } from "./InspectionContext";
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
  const { isInspectionActive, setHoveredComponent } = useInspection();
  const instanceIndex = React.useMemo(() => getNextInstanceIndex(componentName), [componentName]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isInspectionActive) return;

    const target = e.currentTarget as HTMLElement;

    const metadata: ComponentMetadata = {
      componentName,
      componentId: generateComponentId(componentName, instanceIndex),
      variant,
      role,
      usagePath,
      instanceIndex,
      propsSignature: formatPropsSignature(props),
      sourceFile,
    };

    setHoveredComponent(metadata, target);
  };

  const handleMouseLeave = () => {
    if (!isInspectionActive) return;
    setHoveredComponent(null, null);
  };

  // Clone the child element and add inspection handlers
  if (!React.isValidElement(children)) {
    return <>{children}</>;
  }

  const existingProps = (children.props || {}) as any;
  const existingOnMouseEnter = existingProps.onMouseEnter;
  const existingOnMouseLeave = existingProps.onMouseLeave;

  const childWithProps = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter(e);
      if (existingOnMouseEnter) {
        existingOnMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      if (existingOnMouseLeave) {
        existingOnMouseLeave(e);
      }
    },
    "data-inspection-id": generateComponentId(componentName, instanceIndex),
    "data-inspection-name": componentName,
  } as any);

  return <>{childWithProps}</>;
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
