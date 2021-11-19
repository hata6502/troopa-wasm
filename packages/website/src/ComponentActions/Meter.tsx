import { FunctionComponent, memo } from "react";

const Meter: FunctionComponent<{
  value: number;
}> = memo(({ value }) => <>{value}</>);

export { Meter };
