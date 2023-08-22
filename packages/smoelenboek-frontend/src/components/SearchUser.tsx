import React from "react";
import {
  Autocomplete,
  CircularProgress,
  TextField
} from "@mui/material";
import {useLazyGetSearchQuery} from "../api/endpoints/user";
import {useTranslation} from "react-i18next";

interface SearchUserProps {
  onSelect: (value: User) => void;
  inDrawer?: boolean;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

export const SearchUser: React.FC<SearchUserProps> = (props) => {
  const { t } = useTranslation();

  const [query, setQuery] = React.useState<string>("");
  const [users, setUsers] = React.useState<User[]>([]);
  const [open, setOpen] = React.useState<boolean>(false);

  const [trigger] = useLazyGetSearchQuery();

  const loading = open && users.length === 0;

  const autoComplete = React.useRef();


  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await trigger(query).unwrap();

        setUsers(res.data);
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [query, trigger])

  function onChange(value: User | null) {
    if (value === null) {
      return
    }

    props.onSelect(value)
  }

  if (props.inDrawer) {
    return (
      <Autocomplete
        ref={autoComplete}
        sx={{width: 143}}
        open={open}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        isOptionEqualToValue={(option, value) =>
          `${option.firstName} ${option.lastName}` ===
          `${value.firstName} ${value.lastName}`
        }
        getOptionLabel={option => `${option.firstName} ${option.lastName}`}
        options={users}
        loading={loading}
        clearOnBlur
        blurOnSelect
        multiple={false}
        onChange={(_event, value) => {
          if (value) {
            props.onSelect(value)
          }
        }}
        renderInput={params => (
          <TextField
            {...params}
            sx={{backgroundColor: 'background.main'}}
            placeholder={t("search")}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress
                      color="inherit"
                      size={20}
                    />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />

    );
  }

  return (
    <Autocomplete
      disablePortal
      id="combo-box-demo"
      options={users}
      getOptionLabel={option => `${option.firstName} ${option.lastName}`}
      renderInput={(params) => <TextField {...params} label={t("search")} onChange={(e) => setQuery(e.target.value)}/>}
      onChange={(_event, value) => onChange(value)}
    />
  )
}
