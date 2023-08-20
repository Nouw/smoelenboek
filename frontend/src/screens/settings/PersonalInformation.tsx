import React from "react";
import {Card, CardContent, CircularProgress} from "@mui/material";
import {FormValues, PersonalInformationForm} from "../../components/form/settings/PersonalInformationForm";
import {useAppSelector} from "../../store/hooks";
import {useGetUserInformationQuery} from "../../api/endpoints/auth";

interface PersonalInformationProps {

}

export const PersonalInformation: React.FC<PersonalInformationProps> = () => {
  const id = useAppSelector(state => state.auth.id);

  const { data, isLoading} = useGetUserInformationQuery(id ?? 0);

  if (!id || !data) return null;

  if (isLoading) return <CircularProgress/>

  return (
    <Card>
      <CardContent>
        <PersonalInformationForm base={data!.data as FormValues}/>
      </CardContent>
    </Card>
  )
}
