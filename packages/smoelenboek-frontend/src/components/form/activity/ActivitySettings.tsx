import React from "react";
import {FormControl, FormControlLabel, FormGroup, FormHelperText, Stack, Switch} from "@mui/material";
import {useField} from "formik";
import { useTranslation } from "react-i18next";

interface ActivitySettingsProps {
  name: string;
}

export const ActivitySettings: React.FC<ActivitySettingsProps> = ({ name }) => {
  const { t } = useTranslation(["activity"]);

	const [publicFieldProps, , publicFieldHelpers] = useField(`${name}.public`);
  
	return (
    <Stack>
      <FormControl>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={publicFieldProps.value} onChange={(_event, checked) => publicFieldHelpers.setValue(checked)}
                inputProps={{ 'aria-label': 'controlled' }}
								sx={{ ml: 'auto' }}
              />
            }
            label={t("public")}
            color="primary"
            labelPlacement="start"
          />
          <FormHelperText>
						{t("open-for-external")}  
					</FormHelperText>
        </FormGroup>
      </FormControl> 
    </Stack>
  )
}
