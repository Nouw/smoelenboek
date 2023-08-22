import React from "react";
import {CategoryForm, FormValues} from "../../../components/form/document/CategoryForm";
import {useDocumentsCreateCategoryMutation} from "../../../api/endpoints/documents";
import {addCategories} from "../../../store/feature/documents.slice";
import {useAppDispatch} from "../../../store/hooks";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {Severity} from "../../../providers/SnackbarProvider";
import {useTranslation} from "react-i18next";

interface AddProps {

}

export const Add: React.FC<AddProps> = () => {
  const dispatch = useAppDispatch();
  const snackbar = React.useContext(SnackbarContext);
  const { t } = useTranslation();

  const [createCategoryApi] = useDocumentsCreateCategoryMutation();

  async function submit(values: FormValues & { setSubmitting:(submitting: boolean) => void}) {
    try {
      const res = await createCategoryApi({ name: values.name, type: values.type}).unwrap();

      dispatch(addCategories([res.data]));
      snackbar.openSnackbar(t("message.documents.create"), Severity.SUCCESS);
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
      values.setSubmitting(false);
    }
  }

  return <CategoryForm initialValues={{name: "", type: "photos"}} submit={submit} title={t("dashboard.documents.createCategory")}/>
}
