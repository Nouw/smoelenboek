import React from "react";
import ReactQuill from "react-quill";
import {useTheme} from "@mui/material";

import 'react-quill/dist/quill.bubble.css';

interface StyledTextInputProps {
  height?: number,
}
export const StyledTextInput: React.FC<StyledTextInputProps> = (props) => {
  const theme = useTheme();

  const [value, setValue] = React.useState<string>()

  return (
    <div className="text-editor">
      <ReactQuill
        placeholder="Enter description"
        theme="bubble"
        value={value}
        onChange={(value) => setValue(value)}
        style={{ height: props.height, backgroundColor: theme.palette.background.default}}
      />
    </div>
    )
};
