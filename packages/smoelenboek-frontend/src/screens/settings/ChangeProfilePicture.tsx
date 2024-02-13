import React from "react";
import {Avatar, Button, Card, CardContent, CircularProgress, Stack} from "@mui/material";
import {useAppSelector} from "../../store/hooks";
import {useGetUserInformationQuery, usePostProfilePictureMutation} from "../../api/endpoints/auth";
import {UploadFile} from "@mui/icons-material";
import {SnackbarContext} from "../../providers/SnackbarContext";
import {Severity} from "../../providers/SnackbarProvider";
import {useTranslation} from "react-i18next";

interface ChangeProfilePictureProps {

}

export const ChangeProfilePicture: React.FC<ChangeProfilePictureProps> = () => {
  const id = useAppSelector(state => state.auth.id);
  const { t } = useTranslation(["settings", "error", "messages", "upload"]);

  const snackbar = React.useContext(SnackbarContext);

  const { data, isLoading} = useGetUserInformationQuery(id ?? 0);
  const [trigger] = usePostProfilePictureMutation();

  const [picture, setPicture] = React.useState<string | undefined>('user/default.jpg');

  const inputFile = React.createRef<HTMLInputElement>();

  React.useEffect(() => {
    if (!isLoading) {
      setPicture(data?.data.profilePicture)
    }
  }, [data?.data.profilePicture, isLoading])

  if (!id || !data) return null;

  if (isLoading) return <CircularProgress/>

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

        setPicture(res.data);

        document.dispatchEvent(new Event("profilePictureUpdate"));

        snackbar.openSnackbar(t("messages:settings.profile-picture"), Severity.SUCCESS);
      } catch (e) {
        console.error(e);
        snackbar.openSnackbar(t("error:error-message", Severity.ERROR));
      }
    }
  }



  return (
    <Card>
      <CardContent>
        <Stack spacing={5}>
          <Avatar
            src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${picture ?? 'default.jpg'}`}
            variant="square"
            sx={{width: 200, height: 200, marginLeft: "auto", marginRight: "auto"}}
          />
          <Button startIcon={<UploadFile/>} variant="contained" onClick={() => profilePicture()}>
						{t("common:upload")}
          </Button>
          <input type='file' id='file' ref={inputFile} onChange={() => upload()} style={{display: 'none'}}/>
        </Stack>
      </CardContent>
    </Card>
  )
}
