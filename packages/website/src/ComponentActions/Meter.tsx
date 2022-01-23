import { FunctionComponent, memo } from "react";

export const Meter: FunctionComponent<{ value: number }> = memo(({ value }) => (
  <>{value}</>
));
