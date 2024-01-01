import React from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";



interface DraggableListItemProps {
	id: any;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
	children: React.ReactNode;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}


export const DraggableListItem: React.FC<DraggableListItemProps> = ({ id, index, moveItem, children }) => {
	const ref = React.useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: "Item",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover: (item: DragItem, monitor) => { 
			if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoudingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoudingRect.bottom - hoverBoudingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoudingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "Item",
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));


	return <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>{children}</div>
}
