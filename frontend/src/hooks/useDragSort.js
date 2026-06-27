import { useState, useCallback } from 'react';

export function useDragSort(initialItems = []) {
  const [items, setItems] = useState(initialItems);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const reset = useCallback((newItems) => {
    setItems(newItems);
    setDragIdx(null);
    setOverIdx(null);
    setIsDirty(false);
  }, []);

  const onDragStart = useCallback((e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  }, []);

  const onDrop = useCallback((e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(null);
    setOverIdx(null);
    setIsDirty(true);
  }, [dragIdx]);

  const onDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  const toReorderPayload = useCallback(() =>
    items.map((item, idx) => ({ id: item.id, displayOrder: idx + 1 })), [items]);

  return {
    items,
    setItems,
    dragIdx,
    overIdx,
    isDirty,
    setIsDirty,
    reset,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    toReorderPayload,
  };
}
