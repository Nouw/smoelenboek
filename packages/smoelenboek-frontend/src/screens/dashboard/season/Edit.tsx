import moment from 'moment';
import React from 'react';
import { useParams } from 'react-router-dom';
import {SeasonFormValues, SeasonForm} from '../../../components/form/season/SeasonForm';
import { CircularProgress } from '@mui/material';
import {Severity} from "../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import schema from "./schema";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {useSeasonsMutation, useUpdateMutation} from "../../../api/endpoints/season";
import {addSeasons, updateSeasons} from "../../../store/feature/season.slice";
import {useTranslation} from "react-i18next";

interface EditProps {

}

export const Edit: React.FC<EditProps> = () => {
  const params = useParams();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const seasons = useAppSelector(state => state.season.seasons);
  const season = seasons.entities[params.id ?? -1];
  const { t } = useTranslation(["messages", "error"]);

  const [getSeasons] = useSeasonsMutation();
  const [putSeason] = useUpdateMutation()

  React.useEffect(() => {
    // If there is no season, check if there are new seasons in the backend.
    // Should prevent seasons from being empty if directly using the url.
    if (season === undefined) {
      const getData = async () => {
        try {
          const res = await getSeasons(null).unwrap();

          dispatch(addSeasons(res.data));
        } catch (e) {
          console.error(e);
        }
      }

      getData();
    }
  }, [dispatch, getSeasons, season])
 
  async function submit(values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) {
    try {
      const res = await putSeason({ id: params.id ?? -1, endDate: values.endDate, startDate: values.startDate}).unwrap();

      dispatch(updateSeasons([res.data]));

      snackbar.openSnackbar(t("messages:season.update"), Severity.SUCCESS)
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
      values.setSubmitting(false);
    }

    return
  }

  if (!season || params.id === undefined) {
    return <CircularProgress/>
  }

  return <SeasonForm<SeasonFormValues> schema={schema} submit={submit} initialValues={{startDate: moment(season.startDate), endDate: moment(season.endDate)}} />
}

