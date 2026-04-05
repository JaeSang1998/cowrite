import { useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Persona } from "@cowrite/writer-core";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/store/documentStore";
import { usePersonaStore } from "@/store/personaStore";
import { PersonaCard } from "./PersonaCard";
import { CreatePersonaForm } from "./CreatePersonaForm";

function SortablePersonaCard({
  persona,
  isActive,
  onActivate,
  onUpdate,
  onDelete,
}: {
  persona: Persona;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (updates: Partial<Persona>) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: persona.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PersonaCard
        persona={persona}
        isActive={isActive}
        onActivate={onActivate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function PersonaSettingsView() {
  const document = useDocumentStore((s) => s.document);
  const {
    personas,
    activatePersona,
    createPersona,
    reorderPersonas,
    updatePersona,
    deletePersona,
  } = usePersonaStore();
  const [showForm, setShowForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderPersonas(active.id as string, over.id as string);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-[640px] px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            페르소나 설정
          </h1>
          <p className="text-sm text-muted-foreground">
            문서의 어조와 스타일을 결정하는 페르소나를 관리합니다.
          </p>
        </div>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            추가
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {showForm && (
          <CreatePersonaForm
            onCreate={(overrides) => {
              createPersona(overrides);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={personas.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {personas.map((persona) => (
              <SortablePersonaCard
                key={persona.id}
                persona={persona}
                isActive={persona.id === document.activePersonaId}
                onActivate={() => activatePersona(persona.id)}
                onUpdate={(updates) => updatePersona(persona.id, updates)}
                onDelete={() => deletePersona(persona.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
    </div>
  );
}
