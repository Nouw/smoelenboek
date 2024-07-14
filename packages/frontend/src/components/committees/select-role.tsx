import React from "react";
import { InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { CommitteeFunction } from "backend";

interface SelectRoleProps {
  id: number;
  role: CommitteeFunction;
  onUpdate: (id: number, role: CommitteeFunction) => void | Promise<void>;
}

export const SelectRole: React.FC<SelectRoleProps> = (props) => {
  const [role, setRole] = React.useState<CommitteeFunction>(props.role);

  React.useEffect(() => {
    if (props.role !== role) {
      props.onUpdate(props.id, role);
    }
  }, [props, role])

  function onChange(event: SelectChangeEvent) {
    setRole(event.target.value as unknown as CommitteeFunction)
  }

  return (
    <>
      <InputLabel id="func-picker"></InputLabel>
      <Select
        labelId="func-picker"
        value={role}
        onChange={onChange}
        sx={{ height: 20 }}>
        <MenuItem value="Commissielid">Commissielid</MenuItem>
        <MenuItem value="Voorzitter">Voorzitter</MenuItem>
        <MenuItem value="Penningmeester">Penningmeester</MenuItem>
        <MenuItem value="Secretaris">Secretaris</MenuItem>
        <MenuItem value="Wedstrijdsecretaris">Wedstrijd Secretaris</MenuItem>
        <MenuItem value="Commissaris Zaalwacht en Arbitrage">
          Commissaris Zaalwacht en Arbitrage
        </MenuItem>
        <MenuItem value="Commissaris Externe Zaken">
          Commissaris Externe Zaken
        </MenuItem>      </Select>
    </>
  )
}
