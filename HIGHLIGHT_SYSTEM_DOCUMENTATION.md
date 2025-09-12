# CV Highlight System Documentation

## ⚠️ CRITICAL WARNING - DO NOT MODIFY UNLESS EXPLICITLY REQUESTED ⚠️

**This highlight system has been carefully developed and debugged over multiple iterations. Any changes to the core highlighting functionality should ONLY be made if explicitly requested by the user.**

## System Overview

The CV highlight system implements a Google Docs-style comment system that allows AI feedback to be displayed as interactive highlights on specific text portions within the CV.

## Core Components

### 1. SmartText Component (`/src/components/CV/SmartText.tsx`)
**DO NOT MODIFY THE CORE LOGIC**

This component is responsible for:
- Finding all highlights in text based on `targetText` matching
- Handling overlapping highlights by merging them
- Rendering highlighted text with proper color coding
- Triggering the comment panel when highlights are clicked

**Key Features:**
- Case-insensitive text matching using `text.toLowerCase().indexOf(comment.targetText.toLowerCase())`
- Merging overlapping highlights to prevent UI conflicts
- Color-coded highlighting based on feedback severity and type

### 2. CommentHighlight Component (`/src/components/CV/CommentHighlight.tsx`)
**DO NOT MODIFY THE HIGHLIGHTING LOGIC**

This component handles:
- Individual highlight rendering with proper styling
- Click event handling to show comment panel
- Color determination based on feedback severity (red for high, orange for medium, etc.)
- Hover effects and cursor styling

**Color Scheme (DO NOT CHANGE):**
- High severity issues: `bg-red-200 border-b-2 border-red-400 hover:bg-red-300`
- Medium severity issues: `bg-orange-200 border-b-2 border-orange-400 hover:bg-orange-300`
- Low severity issues: `bg-yellow-200 border-b-2 border-yellow-400 hover:bg-yellow-300`
- Recommendations: `bg-blue-200 border-b-2 border-blue-400 hover:bg-blue-300`
- Strengths: `bg-green-200 border-b-2 border-green-400 hover:bg-green-300`

### 3. CommentPanel Component (`/src/components/CV/CommentPanel.tsx`)
**MODAL STYLING AND BEHAVIOR - PRESERVE AS IS**

This component provides:
- Google Docs-style right-side comment panel
- Categorized feedback display with severity indicators
- "Apply Suggestion", "Edit Manually", and "Generate More" buttons
- Proper positioning to avoid viewport clipping

### 4. ResumeTemplate2 Integration
**DO NOT MODIFY THE SMARTTEXT INTEGRATION**

The template integrates SmartText components in specific locations:
- Personal info (name, title)
- Professional summary
- Experience descriptions (line by line)

## Data Structure

### CommentItem Interface
```typescript
interface CommentItem {
  type: FeedbackType // 'issue' | 'recommendation' | 'strength'
  category: string    // 'Grammar', 'Tone', 'Action Verbs', etc.
  title: string      // Brief description
  message: string    // Detailed feedback
  suggestion?: string // AI's suggested replacement text
  severity?: 'low' | 'medium' | 'high'
  targetText: string // Specific text to highlight (CRITICAL FOR MATCHING)
}
```

## Text Replacement Logic
**DO NOT MODIFY THE RECURSIVE REPLACEMENT FUNCTION**

The text replacement in `/src/app/resume/page.tsx` uses a recursive function to find and replace text throughout the resume data structure:

```typescript
const replaceTextInObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj.replace(oldText, newText)
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceTextInObject)
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      result[key] = replaceTextInObject(obj[key])
    }
    return result
  }
  return obj
}
```

## Testing Data
The system includes test data with intentional errors for demonstration:
- Spelling error: "Sales Manger" (should be "Sales Manager")
- Weak language: "I did various tasks" 
- Grammar issues and action verb improvements

## Critical Success Factors

1. **Text Matching**: The `targetText` field must exactly match portions of the CV text for highlights to appear
2. **Case Sensitivity**: Matching is case-insensitive for better reliability
3. **Overlap Handling**: Multiple comments on the same text are properly merged
4. **Color Coding**: Severity-based visual hierarchy guides user attention
5. **Click Interaction**: Clean click handling without text selection conflicts

## What Has Been Tested and Works

- ✅ Text highlighting with color coding
- ✅ Click to show comment panel
- ✅ Apply suggestion functionality with recursive text replacement
- ✅ Multiple feedback types on same text
- ✅ Proper positioning of comment panel
- ✅ Clean UI without "Selected text" display
- ✅ Integration with edit mode

## DO NOT CHANGE UNLESS REQUESTED

This system represents significant development effort and debugging. The highlighting logic, color schemes, text matching, and comment panel behavior should remain unchanged unless the user explicitly requests modifications.

Any changes could break:
- Text matching accuracy
- Visual feedback clarity  
- Click interaction behavior
- Comment panel positioning
- Text replacement functionality

## Change Log
- Initial implementation: Google Docs-style highlighting system
- Removed "Selected text" display from comment panel per user request
- System documented and preserved for future reference

**Remember: ONLY modify if explicitly requested by the user!**