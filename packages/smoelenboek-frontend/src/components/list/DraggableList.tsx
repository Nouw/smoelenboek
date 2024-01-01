import React, { useCallback } from "react";
import update from "immutability-helper";
import { DraggableListItem } from "./DraggableListItem";
import { Box } from "@mui/material";

interface DraggableListProps {
  listItems: Item[];
  renderListItem: (item: Item, index: number) => React.ReactNode;
}

export interface Item {
  id: string | number;
  label: string;
}

export const DraggableList: React.FC<DraggableListProps> = (
  { listItems, renderListItem },
) => {
  const [items, setItems] = React.useState<Item[]>(listItems);

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setItems((prevState) =>
      update(prevState, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevState[dragIndex] as Item],
        ],
      })
    );
  }, []);

  const renderItem = useCallback((item: Item, index: number) => {
    return (
      <DraggableListItem
        key={item.id}
        index={index}
        id={item.id}
        moveItem={moveItem}
      >
        {renderListItem(item, index)}
      </DraggableListItem>
    );
  }, [listItems, items]);

  return <Box>{items.map((item, index) => renderItem(item, index))}</Box>;
};
