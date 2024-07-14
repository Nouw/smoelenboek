import React from "react";
import { useLoaderData, useNavigation, useRevalidator } from "react-router-dom";
import { Box, Card, CardContent, List} from "@mui/material";
import { Category as CategoryEntity } from "backend";
import { Loading } from "../../../components/loading";
import { useUpdateCategoryMutation } from "../../../api/endpoints/categories.api";
import { Season } from "../../../components/categories/season.dashboard";

// TODO: Make the sorting more performant!
export const CategoriesList: React.FC = () => {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const categories = useLoaderData() as { [key: string]: CategoryEntity[] };
  const revalidator = useRevalidator();

  const [updateCategoryTrigger] = useUpdateCategoryMutation();

  async function updateCategory(index: number, direction: "up" | "down", season: string) {
    const sorted = [...categories[season]].sort((a, b) => a.key - b.key)
    const curr = sorted[index];

    if (direction === "up") {
      if (index === sorted[0].id) return

      const next = sorted[index - 1];

      await updateCategoryTrigger({ id: next.id, body: { key: curr.key } });
      await updateCategoryTrigger({ id: curr.id, body: { key: next.key } });
    }

    if (direction === "down") {
      if (index === sorted[sorted.length].id) return

      const next = sorted[index + 1];

      await updateCategoryTrigger({ id: next.id, body: { key: curr.key } });
      await updateCategoryTrigger({ id: curr.id, body: { key: next.key } });
    }

    revalidator.revalidate()
  }

  if (isLoading) return <Loading />;

  return (
    <Box sx={{ flexGrow: 1, flex: 1 }} display="flex" justifyContent="center" alignItems="center">
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <List>
            {Object.keys(categories).map((key) => (
              <Season categoryKey={key} categories={categories} updateCategory={updateCategory} />
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
