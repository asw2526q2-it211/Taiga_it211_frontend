import { useState, useCallback, useRef } from 'react';

/**
 * Genèric per a ítems que tinguin un `id` i un `order`.
 */
interface Orderable {
  id: number;
  order: number;
}

interface UseDragAndDropOptions<T extends Orderable> {
  /** Llista actual d'ítems (ja ordenada visualment). */
  items: T[];
  /** Callback per desar l'ordre canviat al backend. */
  onReorder: (itemId: number, newOrder: number) => void | Promise<void>;
}

interface UseDragAndDropReturn {
  /** Id de l'element que s'està arrossegant (o null). */
  draggedId: number | null;
  /** Id de l'element sobre el qual estem (hover). */
  dropTargetId: number | null;
  /** Referència per al contenidor que embolcalla les files. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Handler per a onDragStart. */
  handleDragStart: (itemId: number) => React.DragEventHandler;
  /** Handler per a onDragOver. */
  handleDragOver: (itemId: number) => React.DragEventHandler;
  /** Handler per a onDragEnd. */
  handleDragEnd: React.DragEventHandler;
  /** Handler per a onDrop. */
  handleDrop: (itemId: number) => React.DragEventHandler;
}

/**
 * Hook que gestiona l'estat de Drag & Drop per a llistes ordenables.
 *
 * Llista d'ítems → es rep ja ordenada visualment.
 * Quan es deixa anar un ítem, es calcula la nova posició i es crida
 * `onReorder` per persistir el canvi.
 */
export function useDragAndDrop<T extends Orderable>({
  items,
  onReorder,
}: UseDragAndDropOptions<T>): UseDragAndDropReturn {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback(
    (itemId: number): React.DragEventHandler =>
      (e) => {
        setDraggedId(itemId);
        e.dataTransfer.effectAllowed = 'move';
        // Per a Firefox cal setDragImage
        const el = e.currentTarget as HTMLElement;
        e.dataTransfer.setDragImage(el, 0, 0);
      },
    [],
  );

  const handleDragOver = useCallback(
    (itemId: number): React.DragEventHandler =>
      (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (itemId !== draggedId) {
          setDropTargetId(itemId);
        }
      },
    [draggedId],
  );

  const handleDragEnd = useCallback<React.DragEventHandler>(
    () => {
      setDraggedId(null);
      setDropTargetId(null);
    },
    [],
  );

  const handleDrop = useCallback(
    (itemId: number): React.DragEventHandler =>
      (e) => {
        e.preventDefault();
        setDropTargetId(null);

        if (draggedId === null || draggedId === itemId) {
          setDraggedId(null);
          return;
        }

        // Trobar l'ítem arrossegat i el de destí
        const draggedItem = items.find((it) => it.id === draggedId);
        const targetItem = items.find((it) => it.id === itemId);
        if (!draggedItem || !targetItem) {
          setDraggedId(null);
          return;
        }

        // El nou order és l'order de l'ítem de destí
        const newOrder = targetItem.order;
        setDraggedId(null);
        onReorder(draggedItem.id, newOrder);
      },
    [draggedId, items, onReorder],
  );

  return {
    draggedId,
    dropTargetId,
    containerRef,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  };
}
