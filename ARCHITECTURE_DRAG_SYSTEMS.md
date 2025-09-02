# Drag Systems Architecture

## Overview
This application uses two separate drag systems that work in harmony:

1. **FlexLayout Native Drag** - For tab reordering within tabsets
2. **dnd-kit** - For bookmark content drag and drop operations

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│ App (No Global DnD)                                         │
│  └── DashboardLayout                                        │
│       └── FlexLayoutManager                                 │
│            └── Layout (FlexLayout native drag enabled)     │
│                 ├── Tab: Markdown (no DnD)                 │
│                 ├── Tab: Web (no DnD)                      │
│                 ├── Tab: Bookmarks                         │
│                 │    └── GlobalDndProvider (scoped)       │
│                 │         └── BookmarksTabManager         │
│                 └── Tab: Browser Favorites                 │
│                      └── GlobalDndProvider (scoped)       │
│                           └── BrowserFavoritesManager     │
└─────────────────────────────────────────────────────────────┘
```

## Drag System Responsibilities

### FlexLayout Native Drag (HTML5)
- **Scope**: Tab headers and tabset containers
- **Function**: Reordering tabs within tabsets
- **Elements**: `.flexlayout__tab`, `.flexlayout__tabset_header`
- **Configuration**: `tabSetEnableDrag: true`, `tabSetEnableDrop: true`

### dnd-kit System
- **Scope**: Bookmark content within specific tab types
- **Function**: Drag bookmarks between lists, cross-tab operations
- **Elements**: Bookmark rows, browser favorites items
- **Provider**: `GlobalDndProvider` (scoped to bookmark tabs only)

## Key Benefits

1. **No Conflicts**: Each system manages distinct DOM elements
2. **Performance**: dnd-kit sensors only active in bookmark contexts
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Easy to add new tab types with or without DnD

## Implementation Pattern

When creating new FlexLayout tab types:

### Without DnD (Simple)
```typescript
if (compKey === 'simple-tab') {
  return <SimpleTabManager config={config} />;
}
```

### With DnD (Bookmark-like)
```typescript
if (compKey === 'draggable-tab') {
  return (
    <GlobalDndProvider>
      <DraggableTabManager config={config} />
    </GlobalDndProvider>
  );
}
```

## Event Flow

### FlexLayout Tab Reorder
1. User starts dragging tab header
2. FlexLayout's HTML5 drag handlers activate
3. dnd-kit is not involved (different DOM scope)
4. Tab reordered within tabset

### Bookmark Drag Operation
1. User starts dragging bookmark within tab content
2. dnd-kit sensors activate (scoped to that tab)
3. FlexLayout drag handlers are not involved (different DOM scope)
4. Bookmark moved/copied between lists

## Troubleshooting

### FlexLayout tabs not draggable?
- Check `tabSetEnableDrag: true` in FlexLayoutService
- Verify no global dnd-kit wrapping entire app
- Look for CSS that might interfere with native drag

### Bookmark drag not working?
- Ensure tab component is wrapped in GlobalDndProvider
- Check if bookmark components register with useGlobalDnd
- Verify dnd-kit sensors are active in console logs

## Configuration Files

- **FlexLayout Config**: `src/services/flexLayoutService.ts`
- **DnD Provider**: `src/components/bookmark/dnd/GlobalDndProvider.tsx`
- **Tab Factory**: `src/components/flexlayout/FlexLayoutTabFactory.tsx`
