import React from "react";
import {useParams} from "react-router-dom";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import moment from "moment";
import {Severity} from "../../../providers/SnackbarProvider";
import {CircularProgress, TextField} from "@mui/material";
import {SeasonForm, SeasonFormValues} from "../../../components/form/season/SeasonForm";
import schema from "../protototo/schema";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {addSeasons, protototoSeasonSelector, updateSeasons} from "../../../store/feature/protototo.slice";
import {useProtototoSeasonsMutation, useUpdateProtototoSeasonMutation} from "../../../api/endpoints/protototo";
import {useTranslation} from "react-i18next";

interface EditProps {

}

interface FormValues extends SeasonFormValues {
  tikkie: string;
}

export const Edit: React.FC<EditProps> = () => {
  const params = useParams();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t }  = useTranslation();

  const season = useAppSelector(state => protototoSeasonSelector.selectById(state, parseInt(params.id as string)));

  const [getSeasons] = useProtototoSeasonsMutation();
  const [updateSeason] = useUpdateProtototoSeasonMutation();

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getSeasons(null).unwrap();

        dispatch(addSeasons(res.data));
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [dispatch, getSeasons])

  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
  async function submit(values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) {
    try {
      const res = await updateSeason({ id: parseInt(params.id as string), endDate: values.endDate, startDate: values.startDate, tikkie: values.tikkie}).unwrap();

      dispatch(updateSeasons([res.data]));

      snackbar.openSnackbar(t("message.protototo.season.update"), Severity.SUCCESS)
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
      values.setSubmitting(false);
    }
  }

  if (!season) {
    return <CircularProgress/>
  }

  return <SeasonForm<FormValues>
    schema={schema}
    submit={submit}
    initialValues={{startDate: moment(season.start), endDate: moment(season.end), tikkie: season.tikkie ?? ""}}
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
