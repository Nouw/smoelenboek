import React from "react";
import { useParams } from "react-router-dom";
import {
  useGetActivityQuery,
  useLazyGetFormResponsesQuery,
  usePostFormSheetMutation,
  usePostFormSyncsheetMutation,
  useUpdateActivityMutation,
} from "../../../api/endpoints/activity.ts";
import { Loading } from "../../../components/Loading.tsx";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  AddToDriveOutlined,
  CloudSync,
  FileOpenOutlined,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Form, Formik } from "formik";
import { InferType } from "yup";
import {
  activity,
  CreateActivity,
} from "../../../components/form/activity/CreateActivity.tsx";
import { LoadingButton, TabContext, TabPanel } from "@mui/lab";
import { Activity } from "smoelenboek-types";
import { Responses } from "../../../components/activity/dashboard/Responses.tsx";
import { SettingsWrapper } from "../../../components/activity/dashboard/SettingsWrapper.tsx";

interface InfoProps {
}

type FormValues = InferType<typeof activity>;

export const Info: React.FC<InfoProps> = () => {
  const { id } = useParams();
  const { t } = useTranslation(["common", "activity"]);

  const { isLoading, data, refetch } = useGetActivityQuery(
    parseInt(id ?? "-1"),
  );
  const [trigger, { isLoading: linkSheetLoading }] = usePostFormSheetMutation();
  const [triggerResponses, { data: responsesData }] =
    useLazyGetFormResponsesQuery();
  const [activityTrigger] = useUpdateActivityMutation();
  const [formSheetSyncTrigger, { isLoading: syncIsLoading }] =
    usePostFormSyncsheetMutation();

  const [tabValue, setTabValue] = React.useState("0");

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

  async function saveActivity(
    values: FormValues,
    setSubmitting: (submitting: boolean) => void,
  ) {
    try {
      await activityTrigger({ id: activity.id, activity: values as unknown as Activity });
    } catch (e) {
      console.error(e);
    }

    setSubmitting(false);
  }

  async function syncSheet() {
    try {
      await formSheetSyncTrigger(activity.form.id);
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
            <TabContext value={tabValue}>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs
                    value={tabValue}
                    onChange={(_e, value) => setTabValue(value)}
                  >
                    <Tab label="Form" value="0" />
                    <Tab label="Single Response" value="1"  />
                    <Tab label="Settings" value="2" />
                  </Tabs>
                </Box>
              </Box>
              <TabPanel value="0"> 
                <Formik<{ activity: FormValues }>
                  initialValues={{ activity: { ...data.data, committee: data.data.commitee.id } }}
                  onSubmit={(values, { setSubmitting }) => {
                    saveActivity({ ...values.activity }, setSubmitting);
                  }}
                >
                  {(props) => (
                    <Form>
                      <CreateActivity name="activity" />
                      <Box mt={2}>
                        <LoadingButton
                          type="submit"
                          loading={props.isSubmitting}
                        >
                          <span>{t("common:save")}</span>
                        </LoadingButton>
                      </Box>
                    </Form>
                  )}
                </Formik>
              </TabPanel>
							<TabPanel value="1">
								<Responses formId={activity.form.id}/>
							</TabPanel>
							<TabPanel value="2">
								<SettingsWrapper />
							</TabPanel>
            </TabContext>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
