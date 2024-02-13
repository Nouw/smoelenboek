import React from "react";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {useParams} from "react-router-dom";
import {
  addFiles,
  documentsSelector,
  removeFiles as removeFilesState,
  updateCategory
} from "../../../store/feature/documents.slice";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
import {CategoryForm, FormValues} from "../../../components/form/document/CategoryForm";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {
  useDocumentsDeleteFilesMutation,
  useDocumentsUpdateCategoryMutation,
  useDocumentsUploadFilesMutation, useLazyDocumentsGetFilesQuery
} from "../../../api/endpoints/documents";
import {Severity} from "../../../providers/SnackbarProvider";
import {CategoryType} from "smoelenboek-types/dist/Entities/Category";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import LazyLoad from "react-lazyload";
import {Photo} from "../../../components/documents/Photo";
import {Delete, Download, Upload} from "@mui/icons-material";
import {LoadingButton} from "@mui/lab";
import DoneIcon from '@mui/icons-material/Done';
import {File as FileEntity} from "smoelenboek-types";
import {useTranslation} from "react-i18next";

interface EditProps {

}

interface UploadedFile {
  uploaded: boolean;
  file: File;
}


export const Edit: React.FC<EditProps> = () => {
  const params = useParams();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["common", "documents", "error", "messages"]);

  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const category = useAppSelector(state => documentsSelector.selectById(state, parseInt(params.id as string)));

  const [updateCategoryApi] = useDocumentsUpdateCategoryMutation();
  const [getFiles] = useLazyDocumentsGetFilesQuery();
  const [uploadFiles] = useDocumentsUploadFilesMutation();
  const [deleteFiles] = useDocumentsDeleteFilesMutation();

  const uploads = React.useRef<Array<UploadedFile>>([]);
  const upload = React.createRef<HTMLInputElement>();

  const [selected, setSelected] = React.useState<number[]>([]);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getFiles(parseInt(params.id as string)).unwrap();

        dispatch(updateCategory([res.data[0]]));
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [dispatch, getFiles, params.id])

  if (!category) {
    return <CircularProgress />
  }

  async function categorySubmit(values: FormValues & { setSubmitting:(submitting: boolean) => void}) {
    try {
      const res = await updateCategoryApi({ id: parseInt(params.id as string),  name: values.name, type: values.type}).unwrap();
      dispatch(updateCategory([res.data]));

      snackbar.openSnackbar(t("messages:documents.update"), Severity.SUCCESS)
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
      values.setSubmitting(false);
    }
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

    if (!category?.files) {
      return null;
    }

    for (const file of category.files) {
      elements.push(
        <Grid item key={file.id} xs={1}>
          <LazyLoad height={194} offset={200}>
            <Card>
              <CardHeader action={ <Checkbox value={selected.includes(file.id)} onClick={() => updateSelected(file.id) }/>} sx={{padding: 0, position: 'absolute'}}/>
              <Photo path={file.path}/>
            </Card>
          </LazyLoad>
        </Grid>)
    }

    return elements;
  }

  function renderDocuments() {
    const elements = [];

    if (!category?.files) {
      return null;
    }

    for (const file of category.files) {
      const fileName = file.path.split("/")[1];

      const onDownload = (fileName: string, path: string) => {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = path;
        link.click();
      };

      elements.push(
        <ListItem secondaryAction={<IconButton edge="end" onClick={() => onDownload(fileName, `${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${file.path}`)}><Download/></IconButton>}>
          <Checkbox value={selected.includes(file.id)} onClick={() => updateSelected(file.id) }/>
          <ListItemText primary={fileName}/>
        </ListItem>
      )
    }

    return elements;
  }

  async function fileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUploadLoading(true);
    const files = event.target.files;

    if (!files || !category) {
      setUploadLoading(false);
      return;
    }

    const chunkSize = 10;

    for (let i = 0; i < files.length; i += chunkSize) {
      const formData = new FormData();

      formData.append('id', category.id.toString());
      formData.append('name', category.name);

      const chunk = Array.from(files).slice(i, i + chunkSize);
      const tempUpload = uploads.current;

      for (const file of chunk) {
        formData.append(`documents`, file);
        tempUpload.push({ uploaded: false, file });
      }


      forceUpdate();
      try {
        const res = await uploadFiles(formData).unwrap();

        for (const file of res.data) {
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

        dispatch(addFiles({category, files: res.data.map((file) => {
          const temp = file;

          delete temp["originalName"];

          return temp as FileEntity;
        })}));
      } catch (e) {
        console.error(e);
      }
    }
    setUploadLoading(false);
    console.log(`Done uploading ${uploads.current.length} files!`);
  }

  async function removeFiles() {
    if (!category) {
      return;
    }

    try {
      await deleteFiles(selected);

      dispatch(removeFilesState({ category, files: selected }));

    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }

    setSelected([]);
    setVisible(false);
  }

  return (
    <>
      <Card>
        <CardContent>
          <CategoryForm initialValues={{ name: category.name, type: category.type}} submit={categorySubmit} title={t("documents:update-category")}/>

          <input
            id="file-upload"
            type="file"
            name="file"
            multiple
            onChange={fileChange}
            ref={upload}

            style={{display: 'none'}}
          />
          <Stack direction="row" gap={2} marginY={3}>
            <LoadingButton loading={uploadLoading} variant="contained" onClick={() => upload.current?.click()}>
              <Upload />
							{t("common:upload")}
            </LoadingButton>
            <Box marginLeft="auto">
              <Button variant={selected.length > 0 ? "contained" : "outlined"} disabled={selected.length === 0} startIcon={<Delete/>} onClick={() => setVisible(true)}> {selected.length} {t("documents:files")}</Button>
            </Box>
          </Stack>

          <List sx={{ maxHeight: 150, overflow: "auto" }}>
            {uploads.current.map((item) => (
              <ListItem>
                <ListItemText primary={item.file.name}/>
                {item.uploaded ? <DoneIcon color={"success"}/> : <CircularProgress size={24}/> }
              </ListItem>

            ))}
          </List>

          {category.type === CategoryType.CATEGORY_TYPE_PHOTOS && (
            <>
              <Grid container spacing={2} columns={3}>
                {renderPhotos()}
              </Grid>
            </>
          )}

          {category.type === CategoryType.CATEGORY_TYPE_DOCUMENTS && (
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
