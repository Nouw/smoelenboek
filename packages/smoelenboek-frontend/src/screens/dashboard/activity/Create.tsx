import React from "react";
import { Box, Button, Paper, Step, StepLabel, Stepper } from "@mui/material";
import {
  activity,
  CreateActivity,
} from "../../../components/form/activity/CreateActivity.tsx";
import { Formik, FormikProps } from "formik";
import { InferType, object, string } from "yup";
import { LoadingButton } from "@mui/lab";
import { formQuestionSchema } from "../../../components/form/activity/builder/FormFieldBuilder.tsx";
import { CreateActivityForm } from "../../../components/form/activity/builder/CreateActivityForm.tsx";
import { useCreateActivityMutation } from "../../../api/endpoints/activity.ts";
import { Activity, Form } from "smoelenboek-types";
import { ActivitySettings } from "../../../components/form/activity/ActivitySettings.tsx";
import { useTranslation } from "react-i18next";
import log from "../../../utilities/logger";
import { SnackbarContext } from "../../../providers/SnackbarContext.ts";
import { Severity } from "../../../providers/SnackbarProvider.tsx";

interface StepProperties {
  label: string;
  optional: boolean;
  component: React.ReactNode;
}

const schema = object({
  activity,
  form: object({
    title: string(),
    description: string(),
    questions: formQuestionSchema,
  }),
});

export type FormValues = InferType<typeof schema>;

export const Create: React.FC<{}> = () => {
  const { t } = useTranslation([
    "common",
    "activity",
    "form",
    "settings",
    "api",
  ]);
  const snackbar = React.useContext(SnackbarContext);

  const steps: StepProperties[] = [
    {
      label: t("activity:create-activity"),
      optional: false,
      component: <CreateActivity name="activity" />,
    },
    {
      label: t("form:create-form"),
      optional: true,
      component: <CreateActivityForm name="form" />,
    },
    {
      label: t("settings:settings"),
      optional: false,
      component: <ActivitySettings name="activity" />,
    },
  ];

  const initialValues: FormValues = {
    activity: {
      title: "",
      description: "",
      public: false,
      registrationClosed: new Date(),
      registrationOpen: new Date(),
      location: "",
      max: 0,
      date: new Date(),
    },
    form: {
      title: "",
      description: "",
      questions: [],
    },
  };

  const [activeStep, setActiveStep] = React.useState(0);
  const [trigger] = useCreateActivityMutation();

  const handleNext = async (props: FormikProps<FormValues>) => {
    const errors = await props.validateForm();
    if (activeStep === 0) {
      if (Object.keys(errors.activity ?? {}).length < 1) {
        setActiveStep((prevState) => prevState + 1);
      }
    } else if (activeStep === 1) {
			if (Object.keys(errors.form ?? {}).length < 1) {
				setActiveStep((prevState) => prevState + 1);
			}
		}
  };

  const handleBack = () => {
    setActiveStep((prevState) => prevState - 1);
  };

  async function submit(values: FormValues) {
    try {
      const res = await trigger({
        activity: values.activity as Partial<Activity>,
        form: values.form as Form,
      }).unwrap();

      log.debug("Succesfully created activity entity!");
      snackbar.openSnackbar(
        t(`api:${res.key}`, { name: values.activity.title }),
        Severity.SUCCESS,
      );
    } catch (e) {
      log.error(e);
      snackbar.openSnackbar(
        t("api:entity-creation-failed", { name: values.activity.title }),
      );
    }
  }

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={(values) => submit(values)}
    >
      {(props: FormikProps<FormValues>) => {
        return (
          <form onSubmit={props.handleSubmit} noValidate>
            <Paper elevation={2}>
              <Box p={2} my={1}>
                <Stepper activeStep={activeStep}>
                  {steps.map((properties) => {
                    return (
                      <Step key={properties.label}>
                        <StepLabel optional={properties.optional}>
                          {properties.label}
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              </Box>
            </Paper>
            <Paper elevation={2}>
              <Box p={2}>
                {steps[activeStep].component}
              </Box>
            </Paper>
            <Paper elevation={2}>
              <Box p={2} my={1}>
                <Box sx={{ display: "flex", flexDirection: "row" }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    {t("common:back")}
                  </Button>
                  <Box sx={{ flex: "1 1 auto" }} />
                  {activeStep < steps.length - 1
                    ? <Button onClick={() => handleNext(props)}>Next</Button>
                    : (
                      <LoadingButton type="submit" loading={props.isSubmitting}>
                        {t("common:submit")}
                      </LoadingButton>
                    )}
                </Box>
              </Box>
            </Paper>
          </form>
        );
      }}
    </Formik>
  );
};
