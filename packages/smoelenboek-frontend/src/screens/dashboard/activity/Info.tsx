import React from "react";
import {useParams} from "react-router-dom";
import {
  useGetActivityQuery,
  useLazyGetFormResponsesQuery,
  usePostFormSheetMutation
} from "../../../api/endpoints/activity.ts";
import {Loading} from "../../../components/Loading.tsx";
import {Box, Button, Card, CardContent, Stack, Typography} from "@mui/material";
import {AddToDriveOutlined, FileOpenOutlined} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface InfoProps {

}

export const Info: React.FC<InfoProps> = () => {
  const { id } = useParams();
	const { t } = useTranslation(["activity"]);

  const { isLoading, data, refetch } = useGetActivityQuery(parseInt(id ?? "-1"));
  const [trigger] = usePostFormSheetMutation();
  const [triggerResponses, { data: responsesData }] = useLazyGetFormResponsesQuery();

  React.useEffect(() => {
    if (data?.data.form.id) {
      triggerResponses(data.data.form.id);
    }
  }, [data])

  if (isLoading) {
    return <Loading/>
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
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center">
            <Typography variant="h4">
							{t("responses")} {!responses ? 0 : (responses.length)}
            </Typography>
              {activity.form.sheetId ? (
                <Button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${activity.form.sheetId}`)} startIcon={<FileOpenOutlined/>} sx={{ ml: 'auto' }}>{t("open-sheets")}</Button>
              ) : (
                <Button onClick={() => linkToSheet()} sx={{ ml: 'auto' }} startIcon={<AddToDriveOutlined />}>{t("link-responses-to-sheets")}</Button>
              )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
