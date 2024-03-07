import React from "react";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import { CommitteeForm } from "../../../components/form/committee/CommitteeForm";
import { Add, Delete, Upload, Visibility } from "@mui/icons-material";
import { SelectRole } from "../../../components/form/committee/SelectRole";
import { SearchUser, User } from "../../../components/SearchUser";
import { Severity } from "../../../providers/SnackbarProvider";
import { SnackbarContext } from "../../../providers/SnackbarContext";
import { useParams } from "react-router-dom";
import {
  Member,
  useAddMemberToCommitteeMutation,
  useLazyGetCommitteeQuery,
  useRemoveMemberFromCommitteeMutation,
  useUpdateMemberCommitteeMutation,
	useUpdateCommitteePhotoMutation,
} from "../../../api/endpoints/committees";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  addMemberToCommittee,
  removeMemberFromCommittee,
  setCommittee,
  updateMember as updateMemberState,
} from "../../../store/feature/committees.slice";
import { useTranslation } from "react-i18next";

interface EditProps {}

export const Edit: React.FC<EditProps> = () => {
  const params = useParams();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["common", "committee", "error", "messages"]);

  const [getCommittee] = useLazyGetCommitteeQuery();
  const [addMember] = useAddMemberToCommitteeMutation();
  const [removeMemberApi] = useRemoveMemberFromCommitteeMutation();
  const [updateMemberApi] = useUpdateMemberCommitteeMutation();
	const [updatePhotoApi] = useUpdateCommitteePhotoMutation();

  const committee = useAppSelector((state) => state.committees.committeeInfo);

  const [visible, setVisible] = React.useState<boolean>(false);

	const photoInputRef = React.createRef<HTMLInputElement>();

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getCommittee(parseInt(params.id as string)).unwrap();

        dispatch(setCommittee(res.data));
      } catch (e) {
        console.error(e);
      }
    };

    getData();
  }, [dispatch, getCommittee, params.id]);

  async function addUser(value: User) {
    if (committee?.members !== undefined) {
      if (committee.members.findIndex((x) => x.id === value.id) >= 0) {
        snackbar.openSnackbar(
          `${value.firstName} ${value.lastName} ${
            t(
              "messages:committee.already-part",
            )
          }`,
        );
      }
    }

    try {
      const res = await addMember({
        id: parseInt(params.id as string),
        userId: value.id,
      }).unwrap();
      dispatch(addMemberToCommittee(res.data));

      snackbar.openSnackbar(
        `${t("committee:added")} ${value.firstName} ${value.lastName} ${
          t("message:committee.to-committee")
        }`,
        Severity.SUCCESS,
      );
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }
  }

  async function updateMember(member: Member, index: number, role: string) {
    try {
      const res = await updateMemberApi({ id: member.id, role }).unwrap();

      dispatch(updateMemberState({ key: index, data: res.data }));
      snackbar.openSnackbar(
        t("messages:committee.role-update"),
        Severity.SUCCESS,
      );
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }
  }

  async function removeMember(member: Member) {
    try {
      await removeMemberApi(member.id);

      dispatch(removeMemberFromCommittee(member.id));
      snackbar.openSnackbar(
        t("messages:committee.remove-user"),
        Severity.SUCCESS,
      );
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }
  }

	async function uploadPhoto() {
		const file = photoInputRef.current?.files?.[0];	

		if (!file) {
			return;
		}

		try {
			const form = new FormData();
			form.set("photo", file);

			const res = await updatePhotoApi({ id: parseInt(params.id as string), data: form }).unwrap();

			snackbar.openSnackbar(t(`api:${res.key}`, { name: committee?.committee.name }), Severity.SUCCESS);

			
		} catch (e) {
			console.error(e);
			snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
		}
	}

  if (committee === undefined) {
    return <CircularProgress />;
  }

  return (
    <>
      <Stack spacing={2}>
        <CommitteeForm
          method="put"
          message={t("messages:committee.update")}
          name={committee.committee.name}
          email={committee.committee.email}
        />

        <Card>
          <CardContent>
            <Stack direction="row" spacing={3}>
							<input ref={photoInputRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display: "none" }} />
              <Button
                variant="contained"
                onClick={() => window.open(`/committees/info/${params.id}`)}
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
                  {committee.members.map((member, index) => (
                    <TableRow key={member.user.id}>
                      <TableCell>
                        {member.user.firstName} {member.user.lastName}
                      </TableCell>
                      <TableCell>
                        <SelectRole
                          id={member.id}
                          role={member.function}
                          onUpdate={(p) =>
                            updateMember(member, index, p)}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => removeMember(member)}>
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
};
