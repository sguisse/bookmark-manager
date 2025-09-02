# FlexLayout Tab Drag Fix

## Problem

FlexLayout's native tab reordering (dragging tabs to reorder them within tabsets) was broken after implementing the centralized dnd-kit system via `GlobalDndProvider`.

## Root Cause

- **FlexLayout** uses HTML5 drag-and-drop API for its native tab reordering functionality
- **dnd-kit** was wrapping the entire app via `GlobalDndProvider` with `PointerSensor`
- dnd-kit's `PointerSensor` was intercepting all pointer events before FlexLayout's drag handlers could process them
- This caused a conflict between two drag systems trying to control the same elements

## Solution

**Scoped GlobalDndProvider**: Instead of wrapping the entire app, moved `GlobalDndProvider` to wrap only the bookmark-related tab content that needs dnd-kit functionality.

### Implementation Details

1. **Removed global wrapping** in `App.tsx`
2. **Added targeted wrapping** in `FlexLayoutTabFactory.tsx` for bookmark components:
   ```typescript
   if (compKey === 'bookmarks') {
     return (
       <GlobalDndProvider>
         <BookmarksTabManager nodeId={node.getId()} config={config} onConfigChange={...} />
       </GlobalDndProvider>
     );
   }

   if (compKey === 'browserfavorites' || compKey === 'browser_favorites') {
     return (
       <GlobalDndProvider>
         <BrowserFavorites />
       </GlobalDndProvider>
     );
   }
   ```

3. **Simplified GlobalDndProvider** - removed complex custom sensor logic since it no longer wraps FlexLayout elements

## Architecture Benefits

- ✅ **Clear separation of concerns**: FlexLayout manages tab structure, dnd-kit manages bookmark content
- ✅ **No event conflicts**: Each drag system operates on its intended elements only
- ✅ **Performance optimized**: dnd-kit sensors only active within bookmark tabs
- ✅ **Maintainable**: Simple scoping instead of complex event filtering

## Result

- ✅ **FlexLayout tab reordering** works correctly
- ✅ **Bookmark drag-and-drop** continues to function
- ✅ **Cross-tab bookmark drag** works between bookmark tabs
- ✅ **Browser favorites drag** to bookmarks works
- ✅ **No interference** between drag systems

## Files Modified

- `src/App.tsx` - Removed global GlobalDndProvider wrapping
- `src/components/flexlayout/FlexLayoutTabFactory.tsx` - Added scoped GlobalDndProvider for bookmark tabs
- `src/components/bookmark/dnd/GlobalDndProvider.tsx` - Simplified implementation, updated documentation

## Key Insight

**Scope over complexity**: Rather than creating complex filtering logic to prevent conflicts, it's better to scope drag providers to only wrap the content that actually needs them. This creates natural boundaries and prevents interference between different drag systems.
