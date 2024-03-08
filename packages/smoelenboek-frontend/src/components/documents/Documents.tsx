import { Download } from "@mui/icons-material";
import { IconButton, List, ListItem, ListItemText } from "@mui/material";
import React from "react";
import { File } from "smoelenboek-types";

type DocumentsProps = {
  files: File[];
};

export const Documents: React.FC<DocumentsProps> = ({ files }) => {
  function renderDocuments() {
    const elements = [];

    for (const file of files) {
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
};
