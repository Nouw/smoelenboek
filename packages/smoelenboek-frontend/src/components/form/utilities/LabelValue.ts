export type LabelValuePair = {
  label: string;
  value: any;
};

export function createLabelValueArray<
  T extends Array<LabelValuePair> & Array<{ value: V }>,
  V extends string,
>(...args: T) {
  return args;
}
