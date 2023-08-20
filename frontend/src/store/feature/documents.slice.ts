import {createEntityAdapter, createSlice, EntityState, PayloadAction, Update} from "@reduxjs/toolkit";
import {Category, File} from "smoelenboek-types";
import {RootState} from "../store";

export const categoriesAdapter = createEntityAdapter<Category>({
  selectId: (category) => category.id
});

export interface DocumentsState {
  categories: EntityState<Category>;
}

const initialState: DocumentsState = {
  categories: categoriesAdapter.getInitialState(),
}

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    addCategories(state, action: PayloadAction<Category[]>) {
      categoriesAdapter.addMany(state.categories, action.payload);
    },
    removeCategory(state, action: PayloadAction<number>) {
      categoriesAdapter.removeOne(state.categories, action.payload);
    },
    updateCategory(state, action: PayloadAction<Category[]>) {
      categoriesAdapter.upsertMany(state.categories, action.payload);
    },
    addFiles(state, action: PayloadAction<{category: Category, files: File[]}>) {
      const category = state.categories.entities[action.payload.category.id];

      if (!category) {
        return;
      }

      const changes: Update<Category> = {
        id: action.payload.category.id,
        changes: {
          files: [...category.files, ...action.payload.files]
        }
      }

      categoriesAdapter.updateOne(state.categories, changes);
    },
    removeFiles(state, action: PayloadAction<{category: Category, files: number[] }>) {
      const category = state.categories.entities[action.payload.category.id];

      if (!category) {
        return;
      }

      const files = category.files;

      for (const id of action.payload.files) {
        const index = files.findIndex((x) => x.id === id);

        if (index < 0) {
          break;
        }

        files.splice(index, 1);
      }

      const changes: Update<Category> = {
        id: action.payload.category.id,
        changes: {
          files,
        }
      }

      categoriesAdapter.updateOne(state.categories, changes);
    }
  }
});

export const documentsSelector = categoriesAdapter.getSelectors<RootState>(state => state.documents.categories);

export const {
  addCategories,
  removeCategory,
  updateCategory,
  addFiles,
  removeFiles
} = documentsSlice.actions;

export default documentsSlice.reducer;
