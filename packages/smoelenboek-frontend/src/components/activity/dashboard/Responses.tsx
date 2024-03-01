import React from "react";
import { useDeleteResponseMutation, useGetFormResponsesQuery } from "../../../api/endpoints/activity";
import { Loading } from "../../Loading";
import {
  Box,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { FormAnswer } from "smoelenboek-types";
import { LoadingButton } from "@mui/lab";
import { Delete } from "@mui/icons-material";
import { SnackbarContext } from "../../../providers/SnackbarContext";
import { Severity } from "../../../providers/SnackbarProvider";
import { useTranslation } from "react-i18next";

type ResponsesProps = {
  formId: string;
};

export const Responses: React.FC<ResponsesProps> = ({ formId }) => {
	const { t } = useTranslation("api");

	const snackbar = React.useContext(SnackbarContext);

	const { data, isLoading, refetch } = useGetFormResponsesQuery(formId);
	const [trigger, { isLoading: deleteIsLoading }] = useDeleteResponseMutation();

  const [selected, setSelected] = React.useState<string>("");

  if (isLoading) {
    return <Loading />;
  }

  if (!data?.data) {
    throw new Error(`No data found!`);
  }

  function getName(value: FormAnswer) {
    if (value.user) {
      return `${value.user.firstName} ${value.user.lastName}`;
    }

    return `${value.firstName} ${value.lastName}`;
  }
	
	async function removeResponse() {
		try {
			const res = await trigger(selected).unwrap();
			setSelected("");
			refetch();
			
			snackbar.openSnackbar(t(res.key, { name: getName(response!) }), Severity.SUCCESS)
		}	catch (e) {
			console.error(e);
		}
	}

  const response = data.data.find((x) => x.id === selected);

  return (
    <Box>
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="response-label">Response</InputLabel>
          <Select
            label="response-label"
						value={selected}
            onChange={(e) => setSelected(e.target.value as string)}
          >
            {data?.data.map((value) => (
              <MenuItem value={value.id}>{getName(value)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <LoadingButton loading={deleteIsLoading} disabled={!selected} onClick={() => removeResponse()}>
          <Delete />
        </LoadingButton>
      </Stack>
      <Divider sx={{ marginY: 2 }} />
      <Stack spacing={2}>
        {response && (
          response.values.map((value) => (
            <Stack spacing={1} key={value.id}>
              <Typography variant="h6" fontWeight="bold">
                {value.question.title}
              </Typography>
              <Typography variant="body1">{value.value}</Typography>
              <Divider />
            </Stack>
          ))
        )}
      </Stack>
    </Box>
  );
};
