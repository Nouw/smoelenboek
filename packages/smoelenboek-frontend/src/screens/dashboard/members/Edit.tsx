import React from "react";
import {useParams} from "react-router-dom";
import {FormValues, UserForm} from "../../../components/form/user/UserForm";
import {CircularProgress} from "@mui/material";
import {useMembersMutation} from "../../../api/endpoints/members";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {addMembers} from "../../../store/feature/members.slice";
import {useTranslation} from "react-i18next";

interface EditProps {

}

export const Edit: React.FC<EditProps> = () => {
  const params = useParams();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const members = useAppSelector(state => state.members.members);
  const member = members.entities[params.id ?? -1];

  const [getMembers] = useMembersMutation();

  React.useEffect(() => {
    if (member === undefined) {
      const getData = async () => {
        try {
          const res = await getMembers(null).unwrap();
          dispatch(addMembers(res.data));
        } catch (e) {
          console.error(e);
        }
      }

      getData();
    }
  }, [dispatch, getMembers, member, params.id])

  if (!member) {
    return <CircularProgress/>
  }

  return <UserForm method="put" message={t("message.user.update")} baseValues={member as unknown as FormValues} admin />
}
