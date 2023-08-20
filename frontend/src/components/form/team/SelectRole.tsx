import React from "react";
import {InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import {TeamFunction} from "smoelenboek-types";

interface SelectRoleProps {
  id: number;
  role: TeamFunction;
  onUpdate: (id: number, role: TeamFunction) => void | Promise<void>;
}

export const SelectRole: React.FC<SelectRoleProps> = (props) => {
  const [role, setRole] = React.useState<TeamFunction>(props.role);

  React.useEffect(() => {
    if (props.role !== role) {
      props.onUpdate(props.id, role);
    }
  }, [props, role])

  function onChange(event: SelectChangeEvent) {
    setRole(event.target.value as unknown as TeamFunction)
  }

  return (
    <>
      <InputLabel id="func-picker"></InputLabel>
      <Select
        labelId="func-picker"
        value={role}
        onChange={onChange}
        sx={{height: 20}}>
        <MenuItem value={TeamFunction.Middle}>Midden</MenuItem>
        <MenuItem value={TeamFunction.Setter}>Spelverdeler</MenuItem>
        <MenuItem value={TeamFunction.OutsideHitter}>Passer/loper</MenuItem>
        <MenuItem value={TeamFunction.OppositeHitter}>Diagonaal</MenuItem>
        <MenuItem value={TeamFunction.Libero}>Libero</MenuItem>
        <MenuItem value={TeamFunction.CoachTrainer}>Coach / Trainer</MenuItem>
      </Select>
    </>
  )
}
