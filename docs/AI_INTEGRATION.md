# AI Integration Guide

This guide explains how to use React Component Inspector with AI coding assistants like Cursor, GitHub Copilot, or ChatGPT.

## Why This Tool is AI-Friendly

The metadata format is specifically designed to provide AI assistants with all the context they need to:
- Understand component structure
- Locate source files
- Understand component hierarchy
- Identify props and variants
- Generate precise CSS selectors

## Best Practices for AI Prompts

### 1. Component Modification

**Good Prompt:**
```
I need to modify the SaveButton component. Here's the component metadata:

=== ELEMENT IDENTIFICATION ===
Element Type: button
Element Text/Label: "Save Transaction"
Element ID: save-button
CSS Selector: button#save-button

=== COMPONENT METADATA ===
Component Name: SaveButton
Component ID: save-button-0
Variant: primary
Usage Path: ActivityPage > EditTransactionModal > TransactionForm
Source File: src/components/buttons/SaveButton.tsx
Props: variant=primary, disabled=false

Please change the button color to green and add a checkmark icon.
```

**Why it works:** The AI has:
- Exact file location
- Component name and structure
- Current props
- Usage context

### 2. Finding Components

**Good Prompt:**
```
Find all instances of TransactionCard in the codebase.
The component is defined in: src/components/transactions/TransactionCard.tsx
It's used in: ActivityPage > TransactionList
```

### 3. Debugging Issues

**Good Prompt:**
```
This button isn't working correctly. Component metadata:

=== ELEMENT IDENTIFICATION ===
Element Type: button
Element ID: delete-button-2
CSS Selector: button#delete-button-2

=== COMPONENT METADATA ===
Component Name: DeleteButton
Component ID: delete-button-2
Usage Path: ActivityPage > TransactionList > TransactionCard
Instance: 2
Source File: src/components/buttons/DeleteButton.tsx

The onClick handler should be in the DeleteButton component.
Please check why it's not firing.
```

### 4. Refactoring

**Good Prompt:**
```
Refactor the TransactionCard component. Metadata:

Component Name: TransactionCard
Usage Path: ActivityPage > TransactionList > TransactionCard
Source File: src/components/transactions/TransactionCard.tsx
Props: variant=default, selected=false

Add a new 'priority' prop that changes the border color:
- 'high' = red border
- 'medium' = yellow border
- 'low' = green border
```

### 5. Styling Changes

**Good Prompt:**
```
Update the styling for this component:

Element Type: div
Element Classes: transaction-card, selected
CSS Selector: div.transaction-card.selected
Component: TransactionCard
Source File: src/components/transactions/TransactionCard.tsx

Make the selected state have a thicker border (3px instead of 1px).
```

## Metadata Format Explained

### Element Identification Section
- **Element Type**: HTML tag name - helps AI understand the DOM structure
- **Element Text/Label**: Visible text - helps AI understand component purpose
- **Element ID**: Unique identifier - for precise targeting
- **CSS Selector**: Ready-to-use selector - for styling or testing
- **Position/Size**: Visual information - helps AI understand layout

### Component Metadata Section
- **Component Name**: React component name - for code navigation
- **Component ID**: Unique instance ID - for identifying specific instances
- **Usage Path**: Component hierarchy - shows where component is used
- **Source File**: Exact file path - direct navigation
- **Props**: Key props - shows what affects component behavior

## Example Workflows

### Workflow 1: Quick Component Fix

1. Hold CTRL and hover over the broken component
2. Press CTRL+H to lock the tooltip
3. Click the copy icon
4. Paste into AI chat: "Fix this component: [paste metadata]"
5. AI provides the fix with exact file location

### Workflow 2: Component Discovery

1. Inspect a component you want to understand
2. Copy metadata
3. Ask AI: "Explain what this component does: [paste metadata]"
4. AI explains based on file path, props, and usage context

### Workflow 3: Bulk Updates

1. Inspect one instance of a component
2. Copy metadata
3. Ask AI: "Find all usages of [ComponentName] from [SourceFile] and update them to..."
4. AI uses the source file to find all instances

## Tips for Maximum Effectiveness

1. **Always include the full metadata** - Don't skip sections
2. **Copy element text** - Helps AI understand component purpose
3. **Include usage path** - Shows component hierarchy
4. **Share CSS selector** - For precise targeting
5. **Mention instance index** - If dealing with specific instances

## Common AI Prompt Templates

### Template 1: Component Modification
```
Modify [ComponentName] component:
- File: [SourceFile]
- Usage: [UsagePath]
- Current props: [PropsSignature]

Change: [your change request]
```

### Template 2: Bug Fix
```
Fix bug in [ComponentName]:
- File: [SourceFile]
- Element: [CSS Selector]
- Issue: [description]

[Additional context]
```

### Template 3: Feature Addition
```
Add feature to [ComponentName]:
- File: [SourceFile]
- Current props: [PropsSignature]
- Usage: [UsagePath]

Feature: [description]
```

## Integration with Cursor AI

Since this tool was designed with Cursor AI, it works especially well with Cursor's features:

1. **@codebase references**: Use the source file path with @codebase
2. **Inline chat**: Paste metadata directly into chat
3. **Composer**: Include metadata when describing changes
4. **Codebase indexing**: Source files are already indexed

Example Cursor prompt:
```
@codebase src/components/buttons/SaveButton.tsx

Modify this component based on metadata:
[paste metadata]

Change the button to use a loading state.
```

---

**Remember**: The more context you provide, the better AI can help you!
