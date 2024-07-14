import React from "react";
import {InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import { TeamFunction } from "backend";

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
        <MenuItem value="Middle">Midden</MenuItem>
        <MenuItem value="Setter">Spelverdeler</MenuItem>
        <MenuItem value="Outside hitter">Passer/loper</MenuItem>
        <MenuItem value="Opposite hitter">Diagonaal</MenuItem>
        <MenuItem value="Libero">Libero</MenuItem>
        <MenuItem value="Coach / Trainer">Coach / Trainer</MenuItem>
      </Select>
    </>
  )
}
