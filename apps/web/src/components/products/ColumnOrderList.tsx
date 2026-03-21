import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { COLUMN_LABELS } from './ProductsToolbar';

type Props = {
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  onColumnOrderChange: (order: string[]) => void;
  onColumnVisibilityChange: (id: string, visible: boolean) => void;
};

function SortableColumnItem({
  id,
  checked,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (visible: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center"
    >
      <span
        {...attributes}
        {...listeners}
        className="px-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <DropdownMenuCheckboxItem
        className="flex-1"
        checked={checked}
        onSelect={e => e.preventDefault()}
        onCheckedChange={onCheckedChange}
      >
        {COLUMN_LABELS[id] ?? id}
      </DropdownMenuCheckboxItem>
    </div>
  );
}

export function ColumnOrderList({ columnOrder, columnVisibility, onColumnOrderChange, onColumnVisibilityChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(String(active.id));
      const newIndex = columnOrder.indexOf(String(over.id));
      onColumnOrderChange(arrayMove(columnOrder, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
        {columnOrder.map(id => (
          <SortableColumnItem
            key={id}
            id={id}
            checked={columnVisibility[id] !== false}
            onCheckedChange={visible => onColumnVisibilityChange(id, visible)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
