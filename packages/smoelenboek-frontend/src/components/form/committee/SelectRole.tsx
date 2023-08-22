import React from "react";
import {InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";

interface SelectRoleProps {
  id: number;
  role: string;
  onUpdate: (role: string) => void;
}

export const SelectRole: React.FC<SelectRoleProps> = (props) => {
  function onChange(event: SelectChangeEvent) {
    props.onUpdate(event.target.value);
  }

  return (
    <>
      <InputLabel id="func-picker" />
      <Select
        labelId="func-picker"
        value={props.role}
        onChange={onChange}
        sx={{height: 20}}>
        <MenuItem value="Commissielid">Commissielid</MenuItem>
        <MenuItem value="Voorzitter">Voorzitter</MenuItem>
        <MenuItem value="Penningmeester">Penningmeester</MenuItem>
        <MenuItem value="Secretaris">Secretaris</MenuItem>
        <MenuItem value="Wedstrijdsecretaris">Wedstrijd Secretaris</MenuItem>
        <MenuItem value="Commissaris zaalwacht en arbitrage">
          Commissaris Zaalwacht en Arbitrage
        </MenuItem>
        <MenuItem value="Commissaris externe zaken">
          Commissaris Externe Zaken
        </MenuItem>
      </Select>
    </>
  )
}
