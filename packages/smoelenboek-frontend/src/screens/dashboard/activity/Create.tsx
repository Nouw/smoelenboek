import React from "react";
import {Box, Button, Paper, Step, StepLabel, Stepper} from "@mui/material";
import {CreateActivity} from "../../../components/form/activity/CreateActivity.tsx";
import {Formik, FormikProps} from "formik";
import {boolean, date, InferType, number, object, string} from "yup";
import {LoadingButton} from "@mui/lab";
import {formQuestionSchema} from "../../../components/form/activity/builder/FormFieldBuilder.tsx";
import {CreateActivityForm} from "../../../components/form/activity/builder/CreateActivityForm.tsx";
import {useCreateActivityMutation} from "../../../api/endpoints/activity.ts";
import {Activity, Form} from "smoelenboek-types";
import {ActivitySettings} from "../../../components/form/activity/ActivitySettings.tsx";

interface CreateProps {

}

interface StepProperties {
  label: string;
  optional: boolean;
  component: React.ReactNode;
}

const schema = object({
  activity: object({
    title: string().required(),
    description: string().nullable(),
    location: string().nullable(),
    public: boolean().default(() => true),
    registrationOpen: date(),
    registrationClosed: date(),
    max: number().nullable(),
    date: date().required(),
  }),
  form: object({
    title: string().required(),
    description: string().required(),
    questions: formQuestionSchema,
  }),
})

type FormValues = InferType<typeof schema>;

export const Create: React.FC<CreateProps> = () => {
  const steps: StepProperties[] = [
    {label: 'Create Activity', optional: false, component: <CreateActivity name="activity"/>},
    {label: 'Create Form', optional: true, component: <CreateActivityForm name="form"/>},
    {label: 'Settings', optional: false, component: <ActivitySettings name="activity"/>},
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
      questions: []
    }
  }

  const [activeStep, setActiveStep] = React.useState(0);
  const [trigger, ] = useCreateActivityMutation();

  const handleNext = () => {
    setActiveStep((prevState) => prevState + 1);
  }

  const handleBack = () => {
    setActiveStep((prevState) => prevState - 1);
  }

  async function submit(values: FormValues) {
    const res = await trigger({ activity: values.activity as Partial<Activity>, form: values.form as Form }).unwrap();
    console.log(res);
  }

  return (
    <Formik<FormValues> initialValues={initialValues} onSubmit={(values) => submit(values)}>
      {(props: FormikProps<FormValues>) => (
        <form onSubmit={props.handleSubmit} noValidate>
          <Paper elevation={2}>
            <Box p={2} my={1}>
              <Stepper activeStep={activeStep}>
                {steps.map((properties) => {
                  return (
                    <Step key={properties.label}>
                      <StepLabel optional={properties.optional}>{properties.label}</StepLabel>
                    </Step>
                  )
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
              <Box sx={{display: 'flex', flexDirection: 'row'}}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{mr: 1}}
                >
                  Back
                </Button>
                <Box sx={{flex: '1 1 auto'}}/>
                {activeStep < steps.length - 1 ? (
                  <Button onClick={handleNext}>Next</Button>
                ) : (
                  <LoadingButton type="submit" loading={props.isSubmitting}>Submit</LoadingButton>
                )}
              </Box>
            </Box>
          </Paper>
        </form>
      )}
    </Formik>
  )
}
