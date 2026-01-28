# React Component Inspector

> **A powerful development tool for inspecting React components with AI-friendly metadata extraction. Fully designed by Cursor AI.**

## 🎯 What is This?

React Component Inspector is a development-only tool that helps you identify, inspect, and extract detailed metadata from React components in your application. It's designed to work seamlessly with AI coding assistants (like Cursor) by providing structured, copyable metadata about any component in your UI.

## 🔍 What Problem Does It Solve?

### The Challenge
When working with AI assistants to fix or modify frontend code, you often need to:
- Identify which component is responsible for a specific UI element
- Understand the component's props, variants, and usage context
- Get the exact file path and component structure
- Extract CSS selectors and element identifiers for precise targeting

**Without this tool**, you'd need to:
- Manually inspect the DOM
- Search through codebases
- Guess component names and file locations
- Manually extract element information

### The Solution
React Component Inspector provides:
- **One-click component identification** - Just hold CTRL and hover
- **Rich metadata extraction** - Component name, props, file path, usage context
- **AI-optimized format** - Copy-paste ready metadata for AI assistants
- **Zero production overhead** - Completely disabled in production builds

## 📊 What Data Does It Provide?

When you inspect a component, you get:

### Element Identification
- Element type (HTML tag)
- Element text/label content
- Element ID
- CSS classes
- CSS selector
- Position and size
- Role and accessibility attributes

### Component Metadata
- Component name
- Component ID (unique instance identifier)
- Variant (if applicable)
- Usage path (component hierarchy)
- Instance index
- Props signature (key props affecting behavior)
- Source file path

### Example Output
```
=== ELEMENT IDENTIFICATION ===
Element Type: button
Element Text/Label: "Save Transaction"
Element ID: save-button
Element Classes: MuiButton-root, primary-button
CSS Selector: button#save-button
Position: (450, 320)
Size: 120x36px

=== COMPONENT METADATA ===
Component Name: SaveButton
Component ID: save-button-0
Variant: primary
Usage Path: ActivityPage > EditTransactionModal > TransactionForm
Instance: 0
Props: variant=primary, disabled=false
Source File: src/components/buttons/SaveButton.tsx
```

## 🚀 How to Use This Data for AI-Powered Frontend Optimization

### 1. **Precise Component Targeting**
Copy the metadata and ask your AI assistant:
```
"I need to modify the SaveButton component. Here's the metadata:
[paste metadata]

Change the button color to green and add an icon."
```

### 2. **Context-Aware Refactoring**
The usage path tells you exactly where the component is used:
```
"Refactor the TransactionCard component used in:
ActivityPage > TransactionList > TransactionCard

Make it accept a new 'priority' prop."
```

### 3. **CSS Selector Generation**
Use the CSS selector for automated testing or styling:
```javascript
// The metadata provides: button#save-button
const saveButton = document.querySelector('button#save-button');
```

### 4. **Component Discovery**
Find all instances of a component:
```
"Find all instances of TransactionCard in the codebase.
The component is defined in: src/components/transactions/TransactionCard.tsx"
```

### 5. **AI-Powered Debugging**
Share component metadata with AI to debug issues:
```
"This button isn't working. Component metadata:
[paste metadata]

The onClick handler should be in: src/components/buttons/SaveButton.tsx"
```

## 📦 Installation

```bash
npm install react-component-inspector
```

## 🔧 Setup

### 1. Wrap Your App

```tsx
import { InspectionProvider } from 'react-component-inspector';
import { InspectionTooltip } from 'react-component-inspector';
import { InspectionHighlight } from 'react-component-inspector';
import { setupInterceptors } from 'react-component-inspector';

function App() {
  // Setup request interceptors (optional - blocks API calls when CTRL is held)
  useEffect(() => {
    setupInterceptors();
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

### 2. Add Metadata to Components

#### Option A: Using the Hook (Recommended)

```tsx
import { useInspectionMetadata } from 'react-component-inspector';

function MyButton({ variant, disabled, onClick }) {
  const inspectionProps = useInspectionMetadata({
    componentName: "MyButton",
    variant: variant,
    usagePath: "HomePage > ActionBar",
    props: { variant, disabled },
    sourceFile: "src/components/MyButton.tsx",
  });

  return (
    <button {...inspectionProps} onClick={onClick}>
      Click me
    </button>
  );
}
```

#### Option B: Using the Wrapper Component

```tsx
import { InspectionWrapper } from 'react-component-inspector';

function MyComponent({ variant, children }) {
  return (
    <InspectionWrapper
      componentName="MyComponent"
      variant={variant}
      usagePath="HomePage > ContentArea"
      props={{ variant }}
      sourceFile="src/components/MyComponent.tsx"
    >
      <div>{children}</div>
    </InspectionWrapper>
  );
}
```

#### Option C: Using Data Attributes (Manual)

```tsx
<div
  data-inspection-name="MyComponent"
  data-inspection-id="my-component-0"
  data-inspection-variant="primary"
  data-inspection-usage-path="HomePage > ContentArea"
  data-inspection-instance="0"
  data-inspection-props="variant=primary"
  data-inspection-file="src/components/MyComponent.tsx"
>
  Content
</div>
```

## 🎮 Usage

1. **Activate**: Hold the `CTRL` key (or `Cmd` on Mac)
2. **Inspect**: Hover over any component with inspection metadata
3. **View**: A tooltip appears showing component metadata
4. **Lock**: Press `CTRL+H` to lock the tooltip position
5. **Copy**: Click the copy icon to copy metadata to clipboard
6. **Deactivate**: Release `CTRL` to exit inspection mode

## 🛡️ Safety Features

- **Development Only**: Completely disabled in production (`NODE_ENV !== "development"`)
- **Request Blocking**: When CTRL is held, all API/Firebase requests are blocked to prevent accidental mutations
- **Zero Overhead**: No code included in production builds
- **Non-Intrusive**: Doesn't modify your components or affect their behavior

## 📚 Documentation

- [Quick Start Guide](./docs/QUICK_START.md)
- [API Reference](./docs/API.md)
- [Advanced Usage](./docs/ADVANCED.md)
- [AI Integration Guide](./docs/AI_INTEGRATION.md)

## 🎨 Features

- ✅ Visual component highlighting
- ✅ Rich metadata extraction
- ✅ Copy-to-clipboard functionality
- ✅ Automatic component detection
- ✅ CSS selector generation
- ✅ Usage path tracking
- ✅ Instance indexing
- ✅ Props signature extraction
- ✅ Request blocking during inspection
- ✅ Production-safe (zero overhead)

## 🤖 Designed by Cursor AI

This tool was fully designed and developed using [Cursor](https://cursor.sh), an AI-powered code editor. The entire codebase, architecture, and documentation were created through AI-assisted development, demonstrating the power of AI in building developer tools.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Important Notes

- This tool is **development-only** and will not work in production
- Requires Material-UI (MUI) for the tooltip UI components
- Works best with TypeScript but supports JavaScript
- Request interceptors are optional but recommended for safety

## 💡 Tips for AI Integration

1. **Always copy the full metadata** - It contains all context needed
2. **Include the usage path** - Helps AI understand component hierarchy
3. **Share the source file** - Directs AI to the exact location
4. **Use CSS selectors** - For precise element targeting in AI prompts
5. **Copy element text** - Helps AI understand component purpose

---

**Made with ❤️ using Cursor AI**
