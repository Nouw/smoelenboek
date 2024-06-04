import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetActivityQuery, useLazyGetFormResponsesQuery, usePostFormSheetMutation, usePostFormSyncsheetMutation } from "../../api/endpoints/activity";
import { Loading } from "../../components/Loading";
import { LoadingButton } from "@mui/lab";
import { AddToDriveOutlined, CloudSync, FileOpenOutlined } from "@mui/icons-material";
import { Responses } from "../../components/activity/dashboard/Responses";

export const Dashboard: React.FC = () => {
  const { id } = useParams();
  const { t } = useTranslation(["common", "activity"]);

  const { isLoading, data, refetch } = useGetActivityQuery(
    parseInt(id ?? "-1"),
  );
  const [trigger, { isLoading: linkSheetLoading }] = usePostFormSheetMutation();
  const [formSheetSyncTrigger, { isLoading: syncIsLoading }] =
    usePostFormSyncsheetMutation();
  const [triggerResponses, { data: responsesData }] =
    useLazyGetFormResponsesQuery();

  React.useEffect(() => {
    if (data?.data.form.id) {
      triggerResponses(data.data.form.id);
    }
  }, [data]);

  async function linkToSheet() {
    try {
      await trigger(activity.form.id);
      await refetch();
    } catch (e) {
      console.error(e);
    }
  }

  async function syncSheet() {
    try {
      await formSheetSyncTrigger(activity.form.id);
    } catch (e) {
      console.error(e);
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return null;
  }

  const activity = data?.data;
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
              <Stack direction="row" ml="auto" spacing={3}>
                {activity.form.sheetId &&
                  (
                    <LoadingButton
                      startIcon={<CloudSync />}
                      onClick={() => syncSheet()}
                      loading={syncIsLoading}
                    >
                      Sync Sheets
                    </LoadingButton>
                  )}
                {activity.form.sheetId
                  ? (
                    <Button
                      onClick={() =>
                        window.open(
                          `https://docs.google.com/spreadsheets/d/${activity.form.sheetId}`,
                        )}
                      startIcon={<FileOpenOutlined />}
                    >
                      {t("activity:open-sheets")}
                    </Button>
                  )
                  : (
                    <LoadingButton
                      loading={linkSheetLoading}
                      onClick={() => linkToSheet()}
                      startIcon={<AddToDriveOutlined />}
                    >
                      {t("activity:link-responses-to-sheets")}
                    </LoadingButton>
                  )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent>
            <Responses formId={activity.form.id}/> 
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
