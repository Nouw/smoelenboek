import { Category, Document } from "backend";
import React from "react";
import { useLoaderData, useNavigation } from "react-router-dom";
import { PhotosList } from "./photos.list";
import { Loading } from "../../components/loading";
import { IconButton, List, ListItem, ListItemText } from "@mui/material";
import { Download } from "@mui/icons-material";

export const DocumentsList: React.FC = () => {
  const navigation = useNavigation();
  const data = useLoaderData() as { category: Category, documents: Document[] };

  if (navigation.state === "loading") {
    return <Loading />
  }

  if (data?.category?.type === "photos") {
    return <PhotosList files={data.documents} />
  }

  function renderDocuments() {
    const elements = [];

    for (const file of data.documents) {
      const fileName = file.path.split("/")[1];

      const onDownload = (fileName: string, path: string) => {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = path;
        link.click();
      };

      elements.push(
        <ListItem
          secondaryAction={
            <IconButton
              edge="end"
              onClick={() =>
                onDownload(
                  fileName,
                  `${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${file.path}`,
                )}
            >
              <Download />
            </IconButton>
          }
        >
          <ListItemText primary={fileName} />
        </ListItem>,
      );
    }

    return elements;
  }

  return (
    <List>
      {renderDocuments()}
    </List>
  );

} 
