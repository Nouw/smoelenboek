import React from "react";
import { CategoryForm } from "../../../forms/categories/categories.form";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { FormValues, schema } from "../../../forms/categories/schema";
import { useCreateCategoryMutation } from "../../../api/endpoints/categories.api";
import { useTranslation } from "react-i18next";
import { CategoryType } from "backend";

export const CategoriesAdd: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["documents", "error",]);

  const [createCategoryApi] = useCreateCategoryMutation();

  async function submit(values: FormValues & { setSubmitting: (submitting: boolean) => void }) {
    try {
      await createCategoryApi({ name: values.name, type: values.type as CategoryType }).unwrap();

      success(t("documents:create-category"));
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
      values.setSubmitting(false);
    }
  }

  return <CategoryForm initialValues={schema.cast({})} submit={submit} title={t("documents:create-category")} />
}
