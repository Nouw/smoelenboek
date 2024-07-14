import React from "react";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { Loading } from "../../components/loading";
import { Box, Card, CardContent, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { Category } from "../../components/categories/Category";
import { Category as CategoryEntity } from "backend";

// TODO: Make the sorting more performant!
export const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const data = useLoaderData() as CategoryEntity[];

  if (isLoading) return <Loading />;

  const categories = data;

  return (
    <Box sx={{ flexGrow: 1, flex: 1 }} display="flex" justifyContent="center" alignItems="center">
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <List>
            {Object.keys(categories).map((key) => (
              <>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                <Category name={key}>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {[...categories[key]].sort((a, b) => a.key - b.key).map((category) => (
                    <ListItem>
                      <ListItemButton
                        onClick={() => navigate(`${category.id}`)}
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
    </Box>
  );
}
