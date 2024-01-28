import React from "react";
import {SeasonForm, SeasonFormValues} from "../../../components/form/protototo/SeasonForm";
import schema from "./schema";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {Severity} from "../../../providers/SnackbarProvider";
import {TextField} from "@mui/material";
import moment from "moment";
import {useAppDispatch} from "../../../store/hooks";
import {useAddProtototoSeasonMutation} from "../../../api/endpoints/protototo";
import {addSeasons} from "../../../store/feature/protototo.slice";
import {useTranslation} from "react-i18next";

interface AddProps {

}

interface FormValues extends SeasonFormValues {
  tikkie: string;
}

export const Add: React.FC<AddProps> = () => {
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [createSeason] = useAddProtototoSeasonMutation();

  { }
  async function submit(values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) {
    try {
      const res = await createSeason({ startDate: values.startDate, endDate: values.endDate, tikkie: values.tikkie}).unwrap();

      dispatch(addSeasons([res.data]));
      snackbar.openSnackbar(t("message.protototo.season.create"), Severity.SUCCESS)
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
      values.setSubmitting(false);
    }
  }

  return <SeasonForm<FormValues>
    schema={schema}
    initialValues={{startDate: moment(), endDate: moment(), tikkie: ''}}
    submit={submit}
    fields={(props) => (
      <TextField
        id="tikkie"
        label={t("dashboard.protototo.tikkie")}
        value={props.values.tikkie}
        onChange={props.handleChange}
        error={props.touched.tikkie && Boolean(props.errors.tikkie)}
        helperText={props.touched.tikkie && props.errors.tikkie}
      />
    )}/>
}
