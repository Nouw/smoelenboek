import { Card, CardContent, IconButton, ImageList, ImageListItem, Modal } from "@mui/material";
import { Document } from "backend";
import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ArrowBackIos, ArrowForwardIos, Close, Download } from "@mui/icons-material";

type PhotosListProps = {
  files: Document[];
}

export const PhotosList: React.FC<PhotosListProps> = ({ files }) => {
  const [selected, setSelected] = React.useState<Document>();
  const [visible, setVisible] = React.useState<boolean>(false);

  function changeSelected(value: Document) {
    setSelected(value);
    setVisible(true);
  }

  function forward() {
    const index = files.indexOf(selected!);

    const next = index + 1;

    if (next >= files.length) {
      setSelected(files[0]);
    } else {
      setSelected(files[next]);
    }
  }

  function backward() {
    const index = files.indexOf(selected!);

    const next = index - 1;

    if (next < 0) {
      setSelected(files[files.length - 1]);
    } else {
      setSelected(files[next]);
    }
  }

  function download(fileName: string, path?: string) {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = path ?? "";
    link.click();
  }

  return (
    <Card>
      <CardContent>
        <ImageList cols={3} gap={5} sx={{ flex: 1, height: "100%" }}>
          {files.map((value) => (
            <ImageListItem
              key={value.id}
              onClick={() => changeSelected(value)}
              style={{ overflowY: "clip" }}
            >
              <LazyLoadImage
                src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${value.path}`}
                srcSet={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${value.path}`}
                alt={value.path}
                width="100%"
                height="100%"
                effect="blur"
                style={{ objectFit: "cover" }}
              />
            </ImageListItem>
          ))}
        </ImageList>
        <Modal
          open={visible}
          style={{
            height: "100vh",
            width: "100vw",
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <>
            <IconButton
              onClick={() =>
                download(
                  selected!.path.split("/")[1],
                  `${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${selected!.path
                  }`,
                )}
              style={{ position: "absolute", top: 5, left: 5 }}
            >
              <Download />
            </IconButton>
            <IconButton
              onClick={() => setVisible(false)}
              style={{ position: "absolute", top: 5, right: 5 }}
            >
              <Close />
            </IconButton>
            <IconButton
              onClick={() => backward()}
              style={{ position: "absolute", left: 5, zIndex: 2 }}
            >
              <ArrowBackIos fontSize="large" color="primary" />
            </IconButton>
            {selected !== undefined &&
              (
                <img
                  src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${selected?.path}`}
                  srcSet={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${selected?.path}`}
                  loading="lazy"
                  alt={selected?.path}
                  className="fullscreen-slide"
                />
              )}
            <IconButton
              onClick={() => forward()}
              style={{ position: "absolute", right: 5, zIndex: 2 }}
            >
              <ArrowForwardIos fontSize="large" color="primary" />
            </IconButton>
          </>
        </Modal>

      </CardContent>
    </Card>
  );
}
