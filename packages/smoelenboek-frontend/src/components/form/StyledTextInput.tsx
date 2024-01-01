import React from "react";
import ReactQuill from "react-quill";
import {IconButton, Stack, useTheme} from "@mui/material";

import 'react-quill/dist/quill.bubble.css';
import {FormatBold, FormatItalic, FormatListBulleted, FormatUnderlined} from "@mui/icons-material";

interface StyledTextInputProps {
  value: string;
  height?: number;
  toolbar?: boolean;
  onChange?: (value: string) => void;
}

const modules = {
  toolbar: false,
}

export const StyledTextInput: React.FC<StyledTextInputProps> = (props) => {
  const theme = useTheme();

  const ref = React.useRef<ReactQuill>(null)

  const formatText = (type: string) => {
    if (!ref.current) return;

    const quill = ref.current.getEditor();
    const range = quill.getSelection();

    if (range && range.length > 0) {
      const currentFormat = quill.getFormat(range.index, range.length);
      const isFormatted = currentFormat[type] || false;
      quill.format(type, !isFormatted);
    }
  }

  function onChange(value: string) {
    if (props.onChange) {
      props.onChange(value);
    }
  }

  return (
    <div className="text-editor">
      <style>
        {`
          .ql-editor.ql-blank::before {
            color: ${theme.palette.text.secondary}; /* or any color you prefer */
          }
        `}
      </style>
      <ReactQuill
        ref={ref}
        placeholder="Enter description"
        theme="bubble"
        value={props.value}
        onChange={onChange}
        modules={modules}
        style={{height: props.height, backgroundColor: theme.palette.background.default, color: '#fff'}}
      />
      {toolbar && (
        <Stack direction="row" mt={1}>
          <IconButton onClick={() => formatText("bold")}>
            <FormatBold />
          </IconButton>
          <IconButton onClick={() => formatText("italic")}>
            <FormatItalic />
          </IconButton>
          <IconButton onClick={() => formatText("underline")}>
            <FormatUnderlined />
          </IconButton>
          <IconButton onClick={() => formatText("list")}>
            <FormatListBulleted />
          </IconButton>
        </Stack>
      )}
    </div>
  )
};
