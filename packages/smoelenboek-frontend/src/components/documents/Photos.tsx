import { ArrowBackIos, ArrowForwardIos, Close, Download } from "@mui/icons-material";
import { IconButton, ImageList, ImageListItem, Modal } from "@mui/material";
import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Category, File } from "smoelenboek-types";

type PhotosProps = {
  category: Category;
};

export const Photos: React.FC<PhotosProps> = ({ category }) => {
  const [selected, setSelected] = React.useState<File>();
  const [visible, setVisible] = React.useState<boolean>(false);

  function changeSelected(value: File) {
    setSelected(value);
    setVisible(true);
  }

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

  return (
    <>
      <ImageList cols={3} gap={5}>
        {category.files.map((value) => (
          <ImageListItem
            key={value.id}
            onClick={() => changeSelected(value)}
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
                `${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${
                  selected!.path
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
    </>
  );
};
