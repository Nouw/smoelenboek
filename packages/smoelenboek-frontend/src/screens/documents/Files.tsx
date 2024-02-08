import React from "react";
import {useParams, useNavigate} from "react-router-dom";
import {useDocumentsGetFilesQuery} from "../../api/endpoints/documents";
import {
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  ImageList,
  ImageListItem, List,
  ListItem, ListItemText,
  Modal
} from "@mui/material";
import {Category, File} from "smoelenboek-types";
import {CategoryType} from "smoelenboek-types/dist/Entities/Category";
import {ArrowBackIos, ArrowForwardIos, Close, Download} from "@mui/icons-material";

interface FilesProps {

}

export const Files: React.FC<FilesProps> = () => {
  const params = useParams();
  const navigate = useNavigate();

  const { data, isLoading} = useDocumentsGetFilesQuery(parseInt(params.id ?? '0'));

  const [selected, setSelected] = React.useState<File>();
  const [visible, setVisible] = React.useState<boolean>(false);

  if (isLoading || !data) {
    return <CircularProgress/>
  }

  if (data.data.length < 1) {
    return null;
  }

  function changeSelected(value: File) {
    setSelected(value);
    setVisible(true);
  }

  window.onpopstate = () => {
    setVisible(false);
    navigate(`files/${category.id}`);
  }

  const category: Category = data.data[0];

  function forward() {
    const index = category.files.indexOf(selected as File);

    const next = index + 1;

    if (next >= category.files.length) {
      setSelected(category.files[0]);
    } else {
      setSelected(category.files[next]);
    }
  }

  function backward() {
    const index = category.files.indexOf(selected as File);

    const next = index - 1;

    if (next < 0) {
      setSelected(category.files[category.files.length - 1]);
    } else {
      setSelected(category.files[next]);
    }
  }

  function download(fileName: string, path?: string) {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = path ?? "";
    link.click();
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
            <ListItemText primary={fileName}/>
          </ListItem>
      )
    }

    return elements;
  }

  return (
      <Card>
        <CardContent>
          {category.type === CategoryType.CATEGORY_TYPE_PHOTOS &&
              <>
                  <ImageList cols={3} gap={5}>
                    {category.files.map((value) => (
                        <ImageListItem key={value.id} onClick={() => changeSelected(value)}>
                          <img src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${value.path}`} srcSet={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${value.path}`} loading="lazy" alt={value.path}/>
                        </ImageListItem>
                    ))}
                  </ImageList>
                  <Modal open={visible} style={{ height: "100vh", width: "100vw", backgroundColor: "#000", display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <>
                        <IconButton onClick={() => download(selected!.path.split("/")[1], `${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${selected!.path}`)} style={{ position: "absolute", top: 5, left: 5}}>
                            <Download color="primary"/>
                        </IconButton>
                        <IconButton onClick={() => setVisible(false)} style={{ position: "absolute", top: 5, right: 5}}>
                            <Close color="primary"/>
                        </IconButton>
                      <IconButton onClick={() => backward()} style={{ position: "absolute", left: 5, zIndex: 2}}>
                          <ArrowBackIos fontSize="large" color="primary"/>
                      </IconButton>
                      {selected !== undefined &&
                          <img
                              src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${selected?.path}`}
                              srcSet={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${selected?.path}`}
                              loading="lazy"
                              alt={selected?.path}
                              className="fullscreen-slide"
                          />
                      }
                        <IconButton onClick={() => forward()} style={{ position: "absolute", right: 5, zIndex: 2}}>
                            <ArrowForwardIos fontSize="large" color="primary"/>
                        </IconButton>
                    </>
                  </Modal>
              </>
          }
          { category.type === CategoryType.CATEGORY_TYPE_DOCUMENTS && (
              <List>
                {renderDocuments()}
              </List>
          )}
        </CardContent>
      </Card>
  )
}
