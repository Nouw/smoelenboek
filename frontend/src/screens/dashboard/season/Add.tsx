import React from 'react';
import {SeasonFormValues, SeasonForm} from '../../../components/form/season/SeasonForm';
import {Severity} from "../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import schema from "./schema";
import moment from "moment";
import {useCreateMutation} from "../../../api/endpoints/season";
import {useAppDispatch} from "../../../store/hooks";
import {addSeasons} from "../../../store/feature/season.slice";
import {useTranslation} from "react-i18next";

interface AddProps {

}

export const Add: React.FC<AddProps> = () => {
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [createSeason] = useCreateMutation();

  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
  async function submit(values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) {
    try {
      const res = await createSeason({ startDate: values.startDate, endDate: values.endDate}).unwrap();

      dispatch(addSeasons([res.data]));
      snackbar.openSnackbar(t("message.season.create"), Severity.SUCCESS)
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
      values.setSubmitting(false);
    }
  }

  return (
    <SeasonForm<SeasonFormValues> schema={schema} initialValues={{ startDate: moment(), endDate: moment()}} submit={submit}/>
  )
}

