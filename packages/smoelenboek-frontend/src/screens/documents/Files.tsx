import React from "react";
import { useParams } from "react-router-dom";
import { useDocumentsGetFilesQuery } from "../../api/endpoints/documents";
import { Card, CardContent, CircularProgress } from "@mui/material";
import { Category } from "smoelenboek-types";
import { CategoryType } from "smoelenboek-types/dist/Entities/Category";
import { Documents } from "../../components/documents/Documents";
import { Photos } from "../../components/documents/Photos";

interface FilesProps {
}

export const Files: React.FC<FilesProps> = () => {
  const params = useParams();

  const { data, isLoading } = useDocumentsGetFilesQuery(
    parseInt(params.id ?? "0"),
  );

  if (isLoading || !data) {
    return <CircularProgress />;
  }

  if (data.data.length < 1) {
    return null;
  }

  const category: Category = data.data[0];

  return (
    <Card>
      <CardContent>
        {category.type === CategoryType.CATEGORY_TYPE_PHOTOS &&
          <Photos category={category} />}
        {category.type === CategoryType.CATEGORY_TYPE_DOCUMENTS && (
          <Documents files={category.files} />
        )}
      </CardContent>
    </Card>
  );
};
