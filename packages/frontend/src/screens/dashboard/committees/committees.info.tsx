import React from "react";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useLoaderData, useRevalidator } from "react-router-dom";
import { Committee, CommitteeFunction, User } from "backend";
import { Add, Delete, Upload, Visibility } from "@mui/icons-material";
import { SearchUser } from "../../../components/users/search-user";
import { SelectRole } from "../../../components/committees/select-role";
import { useAddUserToCommitteeMutation, useUpdateUserToCommitteeMutation, useUpdateCommitteeMutation, useRemoveUserToCommitteeMutation } from "../../../api/endpoints/committees.api";
import { CommitteeForm } from "../../../forms/committees/committee.form";
import { Loading } from "../../../components/loading";
import { FormValues } from "../../../forms/committees/schema";

export const CommitteesInfo: React.FC = () => {
  const { success, error, warn } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["common", "committee", "error", "messages"]);

  const [updateCommitteeAPI] = useUpdateCommitteeMutation();
  const [addMember] = useAddUserToCommitteeMutation();
  const [removeMemberApi] = useRemoveUserToCommitteeMutation();
  const [updateMemberApi] = useUpdateUserToCommitteeMutation();
  //const [updatePhotoApi] = useUpdateCommitteePhotoMutation();

  const committee = useLoaderData() as Committee;
  const revalidator = useRevalidator();

  const [visible, setVisible] = React.useState<boolean>(false);

  const photoInputRef = React.createRef<HTMLInputElement>();

  async function updateCommittee({ values, setSubmitting }: { values: FormValues, setSubmitting: (value: boolean) => void }) {
    try {
      await updateCommitteeAPI({ id: committee.id, body: values });

      success(t('messages:committee.update'));
    } catch (e) {
      console.error(e);
      error(t("error:error-message" as any));
    }

    setSubmitting(false);
  }

  async function addUser(value: User) {
    if (committee.userCommitteeSeason?.findIndex((x) => x.user.id === value.id) >= 0) {
      warn(
        `${value.firstName} ${value.lastName} ${t(
          "messages:committee.already-part",
        )
        }`,
      );
    }

    try {
      await addMember({
        committeeId: committee.id,
        userId: value.id,
      }).unwrap();
      revalidator.revalidate();
      success(
        `${t("committee:added")} ${value.firstName} ${value.lastName} ${t("message:committee.to-committee")
        }`,
      );
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  async function updateMember(member: User, role: CommitteeFunction) {
    try {
      await updateMemberApi({ committeeId: committee.id, userId: member.id, func: role }).unwrap();
      revalidator.revalidate();
      success(
        t("messages:committee.role-update"),
      );
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  async function removeMember(id: number) {
    try {
      await removeMemberApi({ committeeId: committee.id, userId: id });
      revalidator.revalidate();
      success(
        t("messages:committee.remove-user"),
      );
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  async function uploadPhoto() {
    const file = photoInputRef.current?.files?.[0];

    if (!file) {
      return;
    }
    //
    //try {
    //  const form = new FormData();
    //  form.set("photo", file);
    //
    //  const res = await updatePhotoApi({ id: committee.id, data: form }).unwrap();
    //
    //  success(t(`api:${res.key}`, { name: committee?.name }));
    //} catch (e) {
    //  console.error(e);
    //  error(t("error:error-message"));
    //}
  }

  if (committee === undefined) {
    return <Loading />;
  }

  return (
    <>
      <Stack spacing={2}>
        <CommitteeForm
          values={{ name: committee.name, email: committee.email }}
          submit={updateCommittee}
          header={t("committee:update-committee")}
        />

        <Card>
          <CardContent>
            <Stack direction="row" spacing={3}>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display: "none" }} />
              <Button
                variant="contained"
                onClick={() => window.open(`/committees/info/${committee.id}`)}
                startIcon={<Visibility />}
              >
                {t("committee:view-photo")}
              </Button>
              <Button variant="contained" startIcon={<Upload />} onClick={() => photoInputRef.current?.click()}>
                {t("committee:update-photo")}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Button variant="contained" onClick={() => setVisible(true)}>
              <Add />
              {t("committee:add-member")}
            </Button>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("committee:name")}</TableCell>
                    <TableCell>{t("committee:role")}</TableCell>
                    <TableCell>{t("remove")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {committee.userCommitteeSeason.map((userCommitteeSeason) => (
                    <TableRow key={userCommitteeSeason.user.id}>
                      <TableCell>
                        {userCommitteeSeason.user.firstName} {userCommitteeSeason.user.lastName}
                      </TableCell>
                      <TableCell>
                        <SelectRole
                          id={userCommitteeSeason.id}
                          role={userCommitteeSeason.function}
                          onUpdate={(_id, role) =>
                            updateMember(userCommitteeSeason.user, role)}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => removeMember(userCommitteeSeason.user.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>{t("committee:add-member")}</DialogTitle>
        <DialogContent style={{ width: 400, height: 200 }}>
          <SearchUser onSelect={addUser} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
