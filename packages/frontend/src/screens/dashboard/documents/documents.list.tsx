import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid, IconButton,
  List,
  ListItem,
  ListItemText,
  Stack
} from "@mui/material";
import LazyLoad from "react-lazyload";
import { Delete, Download, Upload } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import DoneIcon from '@mui/icons-material/Done';
import { useTranslation } from "react-i18next";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useLoaderData } from "react-router-dom";
import { Category, CategoryType, Document } from "backend";
import { FormValues } from "../../../forms/categories/schema";
import { useUpdateCategoryMutation } from "../../../api/endpoints/categories.api";
import { CategoryForm } from "../../../forms/categories/categories.form";
import { useDeleteDocumentsMutation, useUploadDocumentsMutation } from "../../../api/endpoints/documents.api";

interface UploadedFile {
  uploaded: boolean;
  file: File;
}

export const DocumentsList: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["common", "documents", "error", "messages"]);

  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const data = useLoaderData() as { category: Category, documents: Document[] };

  const [updateCategoryApi] = useUpdateCategoryMutation();
  const [uploadFiles] = useUploadDocumentsMutation();
  const [deleteFiles] = useDeleteDocumentsMutation();

  const uploads = React.useRef<Array<UploadedFile>>([]);
  const upload = React.createRef<HTMLInputElement>();

  const [selected, setSelected] = React.useState<number[]>([]);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = React.useState<boolean>(false);
  

  async function categorySubmit(values: FormValues & { setSubmitting: (submitting: boolean) => void }) {
    try {
      await updateCategoryApi({ id: data.category.id, body: { name: values.name, type: values.type as CategoryType } }).unwrap();

      success(t("messages:documents.update"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }


    values.setSubmitting(false);
  }


  function updateSelected(id: number) {
    if (selected.includes(id)) {
      const index = selected.indexOf(id);

      setSelected(prevState => {
        const newState = [...prevState];

        newState.splice(index, 1);

        return newState;
      })
    } else {
      setSelected((prevState) => [...prevState, id])
    }
  }

  function renderPhotos() {
    const elements = [];

    if (!data.documents) {
      return null;
    }

    for (const file of data.documents) {
      elements.push(
        <Grid item key={file.id} xs={1}>
          <LazyLoad height={194} offset={200}>
            <Card>
              <CardHeader action={<Checkbox value={selected.includes(file.id)} onClick={() => updateSelected(file.id)} />} sx={{ padding: 0, position: 'absolute' }} />
              <CardMedia src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${file.path}`} component="img" height="194" />
            </Card>
          </LazyLoad>
        </Grid>)
    }

    return elements;
  }

  function renderDocuments() {
    const elements = [];

    if (!data?.documents) {
      return null;
    }

    for (const file of data.documents) {
      const fileName = file.path.split("/")[1];

      const onDownload = (fileName: string, path: string) => {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = path;
        link.click();
      };

      elements.push(
        <ListItem secondaryAction={<IconButton edge="end" onClick={() => onDownload(fileName, `${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${file.path}`)}><Download /></IconButton>}>
          <Checkbox value={selected.includes(file.id)} onClick={() => updateSelected(file.id)} />
          <ListItemText primary={fileName} />
        </ListItem>
      )
    }

    return elements;
  }

  async function fileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUploadLoading(true);
    const files = event.target.files;

    if (!files || !data.category) {
      setUploadLoading(false);
      return;
    }

    const chunkSize = 10;

    for (let i = 0; i < files.length; i += chunkSize) {
      const formData = new FormData();

      formData.append('id', data.category.id.toString());
      formData.append('name', data.category.name);

      const chunk = Array.from(files).slice(i, i + chunkSize);
      const tempUpload = uploads.current;

      for (const file of chunk) {
        formData.append(`files`, file);
        tempUpload.push({ uploaded: false, file });
      }


      forceUpdate();
      try {
        const res = await uploadFiles({ id: data.category.id, body: formData }).unwrap();

        for (const file of res) {
          const index = uploads.current.findIndex((x) => {

            return x.file.name === file.originalName
          });

          if (index < 0) {
            continue
          }

          const temp: Array<UploadedFile> = uploads.current;
          temp[index].uploaded = true;

          uploads.current = temp;
          forceUpdate();

        }
      } catch (e) {
        console.error(e);
      }
    }
    setUploadLoading(false);
    console.log(`Done uploading ${uploads.current.length} files!`);
  }

  async function removeFiles() {
    if (!data.category) {
      return;
    }

    try {
      await deleteFiles(selected);
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    setSelected([]);
    setVisible(false);
  }
  
  return (
    <>
      <Card>
        <CardContent>
          <CategoryForm initialValues={{ name: data.category.name, type: data.category.type } as FormValues}
            submit={categorySubmit} title={t("documents:update-category")} />

          <input
            id="file-upload"
            type="file"
            name="file"
            multiple
            onChange={fileChange}
            ref={upload}

            style={{ display: 'none' }}
          />
          <Stack direction="row" gap={2} marginY={3}>
            <LoadingButton loading={uploadLoading} variant="contained" onClick={() => upload.current?.click()}>
              <Upload />
              {t("common:upload")}
            </LoadingButton>
            <Box marginLeft="auto">
              <Button variant={selected.length > 0 ? "contained" : "outlined"} disabled={selected.length === 0} startIcon={<Delete />} onClick={() => setVisible(true)}> {selected.length} {t("documents:files")}</Button>
            </Box>
          </Stack>

          <List sx={{ maxHeight: 150, overflow: "auto" }}>
            {uploads.current.map((item) => (
              <ListItem>
                <ListItemText primary={item.file.name} />
                {item.uploaded ? <DoneIcon color={"success"} /> : <CircularProgress size={24} />}
              </ListItem>

            ))}
          </List>

          {data.category.type === "photos" && (
            <>
              <Grid container spacing={2} columns={3}>
                {renderPhotos()}
              </Grid>
            </>
          )}

          {data.category.type === "documents" && (
            <List>
              {renderDocuments()}
            </List>
          )}
        </CardContent>
      </Card>
      <Dialog open={visible} onClose={() => setVisible(false)} >
        <DialogTitle>{t("documents:delete-files")}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("common:confirmation")} {selected.length} {t("documents:files")}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <DialogActions>
            <Button onClick={() => setVisible(false)}>{t("common:cancel")}</Button>
            <Button variant="contained" onClick={() => removeFiles()}>{t("common:remove")}</Button>
          </DialogActions>
        </DialogActions>
      </Dialog>
    </>

  )
}
