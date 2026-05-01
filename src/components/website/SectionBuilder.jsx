import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { EXTRA_SECTIONS } from '@/lib/themeTemplates';

function SortableItem({ section, onToggle, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 bg-white border rounded-xl transition-colors ${
        section.enabled ? 'border-slate-200' : 'border-slate-100 bg-slate-50'
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className={`flex-1 text-sm font-medium ${section.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
        {section.label}
      </span>
      <button
        onClick={() => onToggle(section.id)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        {section.enabled
          ? <Eye className="h-4 w-4 text-slate-500" />
          : <EyeOff className="h-4 w-4 text-slate-300" />
        }
      </button>
      {section.removable && (
        <button
          onClick={() => onRemove(section.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-slate-300 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function SectionBuilder({ sections, onChange, themeColor }) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      onChange(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const handleToggle = (id) => {
    onChange(sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleRemove = (id) => {
    onChange(sections.filter(s => s.id !== id));
  };

  const handleAddSection = (extra) => {
    // Check if already exists
    if (sections.some(s => s.id === extra.id)) {
      setShowAddMenu(false);
      return;
    }
    onChange([...sections, { ...extra }]);
    setShowAddMenu(false);
  };

  const availableExtras = EXTRA_SECTIONS.filter(
    extra => !sections.some(s => s.id === extra.id)
  );

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <SortableItem
              key={section.id}
              section={section}
              onToggle={handleToggle}
              onRemove={handleRemove}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Section */}
      {availableExtras.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Section
          </button>
          {showAddMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {availableExtras.map((extra) => (
                <button
                  key={extra.id}
                  onClick={() => handleAddSection(extra)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" style={{ color: themeColor }} />
                  <span className="font-medium text-slate-700">{extra.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
