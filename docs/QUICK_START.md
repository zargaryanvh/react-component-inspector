# Quick Start Guide

Get up and running with React Component Inspector in 5 minutes.

## Installation

```bash
npm install react-component-inspector
```

## Basic Setup

### 1. Wrap Your App

```tsx
import { InspectionProvider } from 'react-component-inspector';
import { InspectionTooltip } from 'react-component-inspector';
import { InspectionHighlight } from 'react-component-inspector';
import { setupInterceptors } from 'react-component-inspector';

function App() {
  useEffect(() => {
    setupInterceptors(); // Optional: blocks API calls when CTRL is held
  }, []);

  return (
    <InspectionProvider>
      <YourApp />
      <InspectionTooltip />
      <InspectionHighlight />
    </InspectionProvider>
  );
}
```

### 2. Add Metadata to a Component

```tsx
import { useInspectionMetadata } from 'react-component-inspector';

function MyButton({ variant, onClick }) {
  const inspectionProps = useInspectionMetadata({
    componentName: "MyButton",
    variant: variant,
    usagePath: "HomePage > ActionBar",
    props: { variant, onClick },
    sourceFile: "src/components/MyButton.tsx",
  });

  return (
    <button {...inspectionProps} onClick={onClick}>
      Click me
    </button>
  );
}
```

### 3. Use It!

1. **Hold CTRL** (or Cmd on Mac)
2. **Hover** over your component
3. **See** the metadata tooltip
4. **Press CTRL+H** to lock the tooltip
5. **Click** the copy icon to copy metadata
6. **Release CTRL** to exit

## That's It!

You're ready to inspect components. For more advanced usage, see the [Full Documentation](./README.md).
