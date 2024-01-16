import React from "react";
import {FormControl, FormControlLabel, FormGroup, FormHelperText, Stack, Switch} from "@mui/material";
import {useField} from "formik";

interface ActivitySettingsProps {
  name: string;
}

export const ActivitySettings: React.FC<ActivitySettingsProps> = ({ name }) => {
  const [publicFieldProps, , publicFieldHelpers] = useField(`${name}.public`);
  const [responseFieldProps, , responseFieldHelpers] = useField(`${name}.response`);

  return (
    <Stack>
      <FormControl>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                value={publicFieldProps.value} onChange={(_event, checked) => publicFieldHelpers.setValue(checked)}
                sx={{ ml: 'auto' }}
              />
            }
            label={"Public"}
            color="primary"
            labelPlacement="start"
          />
          <FormHelperText>
            Zet dit op true als deze acitiviteit ook open is voor externe
          </FormHelperText>
        </FormGroup>
      </FormControl>
      <FormControl>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                value={responseFieldProps.value} onChange={(_event, checked) => responseFieldHelpers.setValue(checked)}
                sx={{ ml: 'auto' }}
              />
            }
            label="Verstuur een kopie van de antwoorden via email"
            color="primary"
            labelPlacement="start"
          />
        </FormGroup>
      </FormControl>
    </Stack>
  )
}
