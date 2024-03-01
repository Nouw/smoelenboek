import { Formik, FormikProps } from "formik";
import React from "react";
import { ActivitySettings } from "../../form/activity/ActivitySettings";
import { LoadingButton } from "@mui/lab";
import { useTranslation } from "react-i18next";
import { Divider } from "@mui/material";
import { useParams } from "react-router-dom";
import { useGetActivityQuery, useUpdateActivitySettingsMutation } from "../../../api/endpoints/activity";
import { SnackbarContext } from "../../../providers/SnackbarContext";
import { Severity } from "../../../providers/SnackbarProvider";
import { Loading } from "../../Loading";

type FormValues = {
  activity: {
    public: boolean;
  };
};

export const SettingsWrapper: React.FC = () => {
  const { t } = useTranslation(["common", "api"]);
	const params = useParams();
	const snackbar = React.useContext(SnackbarContext);

	const { data } = useGetActivityQuery(parseInt(params.id ?? ""), { refetchOnMountOrArgChange: true });
	const [trigger] = useUpdateActivitySettingsMutation();

	if (!params.id) {
		throw new Error("Id not specified in params");	
	}

  async function onSubmit(
    values: FormValues,
    setSubmitting: (submitting: boolean) => void,
  ) {
		try {
			console.log(values);
			const res = await trigger({ id: parseInt(params.id ?? ""), ...values.activity }).unwrap();
				
			setSubmitting(false);
			snackbar.openSnackbar(t(`api:${res.key}`, { name: data?.data.title }), Severity.SUCCESS);
		} catch (e) {
			console.error(e);
		}
	};

	if (!data?.data) {
		return <Loading />
	}
  
	return (
    <Formik<FormValues>
      initialValues={{ activity: { public: data.data.public } }}
			enableReinitialize	
      onSubmit={(values, { setSubmitting }) => onSubmit(values, setSubmitting)}
    >
      {(props: FormikProps<FormValues>) => (
        <form noValidate onSubmit={props.handleSubmit}>
          <ActivitySettings name="activity" />
          <Divider sx={{ my: 2 }} />
          <LoadingButton
            variant="contained"
            type="submit"
            loading={props.isSubmitting}
          >
            {t("common:save")}
          </LoadingButton>
        </form>
      )}
    </Formik>
  );
};
