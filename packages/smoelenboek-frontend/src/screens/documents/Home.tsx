import React from "react";
import {
  Alert,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Category } from "../../components/documents/Category";
import { useNavigate } from "react-router-dom";
import { useDocumentsCategoriesQuery } from "../../api/endpoints/documents";

interface HomeProps {
}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useDocumentsCategoriesQuery(false);

  if (isLoading) return <CircularProgress />;

  const categories = data!.data;

  return (
    <>
      <Card>
        <CardContent>
          <List>
            {Object.keys(categories).map((key) => (
              <>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                <Category name={categories[key].name}>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {categories[key].categories.map((category) => (
                    <ListItem>
                      <ListItemButton
                        onClick={() => navigate(`files/${category.id}`)}
                      >
                        <ListItemText primary={category.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </Category>
              </>
            ))}
          </List>
        </CardContent>
      </Card>
    </>
  );
};
