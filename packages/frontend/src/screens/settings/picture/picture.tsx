import React from "react";
import { Avatar, Button, Card, CardContent, CircularProgress, Stack } from "@mui/material";
import { UploadFile } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useAppSelector } from "../../../store/hooks";
import { useLoaderData, useNavigation } from "react-router-dom";
import { usePostProfilePictureMutation } from "../../../api/endpoints/user.api";

export const Picture: React.FC = () => {
  const id = useAppSelector(state => state.auth.id);
  const { t } = useTranslation(["settings", "error", "messages", "upload"]);
  const navigation = useNavigation();
  const { success, error } = React.useContext(SnackbarContext);
  const data = useLoaderData() as { picture: string };
  const isLoading = navigation.state === "loading";

  const [trigger] = usePostProfilePictureMutation();

  const [picture, setPicture] = React.useState<string | undefined>('user/default.jpg');

  const inputFile = React.createRef<HTMLInputElement>();

  React.useEffect(() => {
    if (!isLoading) {
      setPicture(data.picture)
    }
  }, [data, isLoading])

  if (!id || !data) return null;

  if (isLoading) return <CircularProgress />

  function profilePicture() {
    inputFile.current?.click();
  }

  async function upload() {
    const files = inputFile.current?.files;

    if (!files) {
      return;
    }

    if (files.length === 1) {
      const file = files[0];

      try {
        const form = new FormData();
        form.set('profilePicture', file);

        const res = await trigger(form).unwrap();

        setPicture(res.profilePicture);

        document.dispatchEvent(new Event("profilePictureUpdate"));

        success(t("messages:settings.profile-picture"));
      } catch (e) {
        console.error(e);
        error(t("error:error-message"));
      }
    }
  }



  return (
    <Card>
      <CardContent>
        <Stack spacing={5} flex={1} justifyContent="center">
          <Avatar
            src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${picture ?? 'user/default.jpg'}`}
            variant="square"
            sx={{ width: 200, height: 200, mx: "auto" }}
          />
          <Button startIcon={<UploadFile />} variant="contained" onClick={() => profilePicture()}>
            {t("common:upload")}
          </Button>
          <input type='file' id='file' ref={inputFile} onChange={() => upload()} style={{ display: 'none' }} />
        </Stack>
      </CardContent>
    </Card>
  )
}
