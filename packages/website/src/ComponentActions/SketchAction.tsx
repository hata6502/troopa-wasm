import { Button } from "@material-ui/core";
import { memo, useCallback } from "react";
import type { FunctionComponent } from "react";
import { saveSketch } from "../sketch";
import type { Sketch } from "../sketch";

const SketchAction: FunctionComponent<{
  sketch: Sketch;
}> = memo(({ sketch }) => {
  const handleSaveButtonClick = useCallback(
    () => saveSketch({ sketch }),
    [sketch]
  );

  return (
    <Button
      variant="outlined"
      className="cancel-component-container-drag"
      size="small"
      onClick={handleSaveButtonClick}
    >
      save
    </Button>
  );
});

export { SketchAction };
