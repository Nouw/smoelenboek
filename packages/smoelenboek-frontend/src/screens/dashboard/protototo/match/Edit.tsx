import React from "react";
import {SnackbarContext} from "../../../../providers/SnackbarContext";
import {useParams} from "react-router-dom";
import {FormValues, MatchForm} from "../../../../components/form/protototo/MatchForm";
import {Severity} from "../../../../providers/SnackbarProvider";
import moment from "moment";
import {CircularProgress} from "@mui/material";
import {useAppDispatch, useAppSelector} from "../../../../store/hooks";
import {addMatches, protototoMatchSelector, updateMatches} from "../../../../store/feature/protototo.slice";
import {useProtototoMatchMutation, useUpdateProtototoMatchMutation} from "../../../../api/endpoints/protototo";
import {useTranslation} from "react-i18next";

interface EditProps {

}

export const Edit: React.FC<EditProps> = () => {
  const snackbar = React.useContext(SnackbarContext);
  const params = useParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["error", "messages", "protototo"]);

  const [getMatch] = useProtototoMatchMutation();
  const [updateMatchApi] = useUpdateProtototoMatchMutation();

  const match = useAppSelector(state => protototoMatchSelector.selectById(state, parseInt(params.matchId as string)));

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getMatch(parseInt(params.matchId as string)).unwrap();

        dispatch(addMatches([res.data]));
      } catch (e) {
        console.error(e);
      }
    }

    if (!match) {
      getData();
    }
  }, [dispatch, getMatch, match, params.matchId])

  async function submit(values: FormValues & { setSubmitting:(submitting: boolean) => void }) {
    try {
      const res = await updateMatchApi({ id: parseInt(params.matchId as string), homeTeam: values.homeTeam, awayTeam: values.awayTeam, gender: values.gender, playDate: values.playDate.toDate(), seasonId: parseInt(params.id ?? "0")}).unwrap();
      dispatch(updateMatches([res.data]));

      snackbar.openSnackbar(t("messages:protototo.match.update"), Severity.SUCCESS)
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
      values.setSubmitting(false);
    }

    return
  }

  function getGender(gender: string) {
    if (gender === "male") {
      return "male"
    } else {
      return "female";
    }
  }

  if (!match) {
    return <CircularProgress />
  }

  return <MatchForm initialValues={{playDate: moment(match.playDate), homeTeam: match.homeTeam, awayTeam: match.awayTeam, gender: getGender(match.gender)}} submit={submit} title={t("protototo:update-match")}/>
}
