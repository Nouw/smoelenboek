import { ArrowDownward, ArrowUpward } from "@mui/icons-material"
import { ListItem, ListItemButton, ListItemText } from "@mui/material"
import { Category as CategoryEntity } from "backend"
import { useNavigate } from "react-router-dom"
import { Category } from "./Category"

type SeasonProps = {
  categoryKey: string;
  updateCategory: (index: number, direction: "up" | "down", key: string) => void,
  categories: { [key : string]: CategoryEntity[] }
}

export const Season: React.FC<SeasonProps> = ({ categoryKey, updateCategory, categories }) => {
  const navigate = useNavigate();

  if (!categories[categoryKey]) return null;

  console.log(categories[categoryKey]);
  const sorted = [...(categories[categoryKey])].sort((a, b) => a.key - b.key);

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Category name={categoryKey}>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        {sorted.map((category, index) => (
          <ListItem>
            <ListItemButton onClick={() => updateCategory(index, "up", categoryKey)} sx={{ maxWidth: 40, mx: 2, justifyContent: "center" }}>
              <ArrowUpward />
            </ListItemButton>
            <ListItemButton onClick={() => updateCategory(index, "down", categoryKey)} sx={{ maxWidth: 40, mx: 2, justifyContent: "center" }}>
              <ArrowDownward />
            </ListItemButton>
            <ListItemButton
              onClick={() => navigate(`${category.id}`)}
            >
              <ListItemText primary={category.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </Category>
    </>
  )
}
