import {Box, Button, Checkbox, Radio, TextField, Typography} from "@mui/material";
import React, { ChangeEvent } from "react";
import { OptionFieldBuilderWrapper } from "./OptionFieldBuilderWrapper.tsx";
import { Add } from "@mui/icons-material";
import { DraggableList, Item } from "../../../list/DraggableList.tsx";

export interface Option {
  id: number;
  label: string;
}

interface FormOptionFieldBuilderProps {
  baseOptions?: Item[];
  onChange?: (options: Item[]) => void;
  type?: "choice" | "select" | "dropdown"
}

export const FormOptionFieldBuilder: React.FC<FormOptionFieldBuilderProps> = (
  { baseOptions = [], onChange, type = "choice" },
) => {
  const [options, setOptions] = React.useState<Item[]>(
    baseOptions.length < 1
      ? [{ key: 1, label: "Optie 1" }, { key: 2, label: "Optie 2" }]
      : baseOptions,
  );

	React.useEffect(() => {
		if (onChange !== undefined) {
			onChange(options);
		}
	}, [options])

	function addOption() {
    setOptions(
      (prevState) => [...prevState, {
        key: prevState.length + 1,
        label: `Optie ${prevState.length}`,
      }]
    );
  }

  function removeOption(index: number) {
    const temp = [...options];

    temp.splice(index, 1);

    setOptions(temp);
  }

	function renderItem(item: Item, index: number) {
		let onDelete = undefined;

		if (options.length > 1) {
			onDelete = () => removeOption(index);
		}

		const onChangeEvent = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setOptions((prevState) => {
				const tempState = prevState;
				tempState[index].label = e.target.value
				return [...tempState];
			});
		}

		return <OptionFieldBuilderWrapper onDelete={onDelete}>
      {type === "select" && <Checkbox disabled /> }
      {type === "choice" && <Radio disabled /> }
      {type === "dropdown" && <Typography>{index + 1}.</Typography>}
			<TextField variant="standard" value={item.label} onChange={(e) => onChangeEvent(e)}/>
		</OptionFieldBuilderWrapper>
	}

  return (
    <Box>
			<DraggableList key={options.length} listItems={options} renderListItem={(item, index) => renderItem(item, index) } />
      <Button startIcon={<Add />} onClick={addOption}>Optie toevoegen</Button>
    </Box>
  );
};
