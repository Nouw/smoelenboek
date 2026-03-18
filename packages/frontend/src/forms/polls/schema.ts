import * as Yup from "yup";

export const schema = Yup.object({
  question: Yup.string().trim().required("field-required").default(""),
  allowMultiple: Yup.boolean().default(false),
  voteStartAt: Yup.date().required("field-required").default(() => new Date()),
  voteEndAt: Yup.date()
    .required("field-required")
    .min(Yup.ref("voteStartAt"), "end-date-after-start")
    .default(() => new Date()),
  options: Yup.array()
    .of(Yup.string().trim().required("field-required"))
    .min(2, "field-required")
    .default(["", ""]),
});

export type PollFormValues = Yup.InferType<typeof schema>;
