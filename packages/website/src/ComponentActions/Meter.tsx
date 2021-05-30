import { memo } from "react";
import type { FunctionComponent } from "react";

const Meter: FunctionComponent<{
  value: number;
}> = memo(({ value }) => <>{value}</>);

export { Meter };
