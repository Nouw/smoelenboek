import React from "react";
import { useParams } from "react-router-dom";
import {
  useGetActivityQuery,
  useLazyGetFormResponsesQuery,
  usePostFormSheetMutation,
} from "../../../api/endpoints/activity.ts";
import { Loading } from "../../../components/Loading.tsx";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { AddToDriveOutlined, FileOpenOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Formik } from "formik";
import { InferType } from "yup";
import {
  activity,
  CreateActivity,
} from "../../../components/form/activity/CreateActivity.tsx";
import { LoadingButton } from "@mui/lab";

interface InfoProps {
}

type FormValues = InferType<typeof activity>;

export const Info: React.FC<InfoProps> = () => {
  const { id } = useParams();
  const { t } = useTranslation(["common", "activity"]);

  const { isLoading, data, refetch } = useGetActivityQuery(
    parseInt(id ?? "-1"),
  );
  const [trigger] = usePostFormSheetMutation();
  const [triggerResponses, { data: responsesData }] =
    useLazyGetFormResponsesQuery();

  React.useEffect(() => {
    if (data?.data.form.id) {
      triggerResponses(data.data.form.id);
    }
  }, [data]);

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return null;
  }

  async function linkToSheet() {
    try {
      await trigger(activity.form.id);
      await refetch();
    } catch (e) {
      console.error(e);
    }
  }

  const activity = data.data;
  const responses = responsesData?.data;

  return (
    <Box>
      <Stack gap={2}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center">
              <Typography variant="h5">
                {t("activity:responses")} {!responses ? 0 : (responses.length)}
              </Typography>
              {activity.form.sheetId
                ? (
                  <Button
                    onClick={() =>
                      window.open(
                        `https://docs.google.com/spreadsheets/d/${activity.form.sheetId}`,
                      )}
                    startIcon={<FileOpenOutlined />}
                    sx={{ ml: "auto" }}
                  >
                    {t("activity:open-sheets")}
                  </Button>
                )
                : (
                  <Button
                    onClick={() => linkToSheet()}
                    sx={{ ml: "auto" }}
                    startIcon={<AddToDriveOutlined />}
                  >
                    {t("activity:link-responses-to-sheets")}
                  </Button>
                )}
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">Details</Typography>
            <Formik<{ activity: FormValues }>
              initialValues={{ activity: data.data }}
              onSubmit={() => console.log("submit")}
            >
              {(props) => (
                <form noValidate onSubmit={props.submitForm}>
                  <CreateActivity name="activity" />
                  <Box mt={2}>
                    <LoadingButton type="submit" loading={props.isSubmitting}>
                      <span>{t("common:save")}</span>
                    </LoadingButton>
                  </Box>
                </form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
