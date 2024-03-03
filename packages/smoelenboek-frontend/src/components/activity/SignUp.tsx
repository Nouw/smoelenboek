import React from "react";
import {
  useGetFormQuery,
  useLazyGetRegistrationQuery,
  usePostRegistrationMutation,
} from "../../api/endpoints/activity";
import { SnackbarContext } from "../../providers/SnackbarContext";
import log from "../../utilities/logger";
import { useTranslation } from "react-i18next";
import { Severity } from "../../providers/SnackbarProvider";
import { Formik, FormikProps } from "formik";
import { Stack } from "@mui/material";
import { Loading } from "../Loading";
import { FormTextField } from "../form/activity/input/FormTextField";
import { FormChoiceField } from "../form/activity/input/FormChoiceField";
import { FormSelectField } from "../form/activity/input/FormSelectField";
import { FormQuestion } from "smoelenboek-types";
import { LoadingButton } from "@mui/lab";
import { useIsAnonymous } from "../../hooks/useIsAnonymous";
import { ContactInfo } from "./ContactInfo";
import { useCookies } from "react-cookie";

interface SignUpProps {
  title: string;
  formId: string;
  onSubmit?: () => void;
}

type FormValues = {
  [key: string]: string | string[];
};

export const SignUp: React.FC<SignUpProps> = ({ title, formId, onSubmit }) => {
  const snackbar = React.useContext(SnackbarContext);
  const { t } = useTranslation(["api", "activity"]);
  const isAnonymous = useIsAnonymous();

  const [triggerRegistration] = usePostRegistrationMutation();
  const { data, isLoading } = useGetFormQuery(formId);
  const [getRegistration, registrationData] = useLazyGetRegistrationQuery();

  const [initialValues, setInitialValues] = React.useState<FormValues>({});
  const [cookies, setCookie] = useCookies([`protos-form-${formId}`]);

  React.useEffect(() => {
    getRegistration({
      id: formId,
      email: cookies[`protos-form-${formId}`]?.email,
    });
  }, [formId]);

  React.useEffect(() => {
    if (registrationData.data?.data) {
      const registration = registrationData.data.data;
      const formValues: FormValues = {};

      for (const value of registration) {
        formValues[value.question.id] = value.value;
      }

      const cookie = cookies[`protos-form-${formId}`];

      setInitialValues({
        ...formValues,
        email: cookie?.email,
        firstName: cookie?.firstName,
        lastName: cookie?.lastName,
      });
    }
  }, [registrationData]);

  async function submit(
    values: FormValues,
    setSubmitting: (value: boolean) => void,
  ) {
    try {
      await triggerRegistration({
        id: formId,
        data: values,
        anonymous: isAnonymous,
      });
      setSubmitting(false);

      snackbar.openSnackbar(
        t("activity:registration-success", { name: title }),
        Severity.SUCCESS,
      );
      log.debug("Succesfully registered for activity");

      if (isAnonymous) {
        setCookie(`protos-form-${formId}`, {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
        });
      }

      if (onSubmit) {
        onSubmit();
      }
    } catch (e) {
      log.error(e);
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    throw new Error("No data provided by API");
  }

  const form = data.data;

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      enableReinitialize
      onSubmit={(values, { setSubmitting }) => submit(values, setSubmitting)}
    >
      {(props: FormikProps<NonNullable<unknown>>) => (
        <form noValidate onSubmit={props.handleSubmit}>
          <Stack spacing={2}>
            {isAnonymous && <ContactInfo />}

            {form.questions.map((question: FormQuestion) => {
              if (question.type === "text") {
                return <FormTextField question={question} />;
              }

              if (question.type === "choice") {
                return <FormChoiceField question={question} />;
              }

              if (question.type === "select") {
                return <FormSelectField question={question} />;
              }

              return;
            })}
            <LoadingButton
              variant="contained"
              type="submit"
              loading={props.isSubmitting}
            >
              Inschrijven
            </LoadingButton>
          </Stack>
        </form>
      )}
    </Formik>
  );
};
