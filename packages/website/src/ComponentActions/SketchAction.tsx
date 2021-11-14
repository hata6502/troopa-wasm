import { Button } from "@material-ui/core";
import { memo, useCallback } from "react";
import type { FunctionComponent } from "react";
import type { SketchV2 } from "../sketch";
import { filePickerOptions } from "../filePickerOptions";

const SketchAction: FunctionComponent<{
  sketch: SketchV2;
}> = memo(({ sketch }) => {
  const handleSaveButtonClick = useCallback(async () => {
    let fileHandle;

    try {
      fileHandle = await showSaveFilePicker(filePickerOptions);
    } catch (exception) {
      if (exception instanceof Error && exception.name === "AbortError") {
        return;
      }

      throw exception;
    }

    const writable = await fileHandle.createWritable();

    await writable.write(JSON.stringify(sketch));
    await writable.close();
  }, [sketch]);

  return (
    <Button
      variant="outlined"
      className="cancel-component-container-drag"
      size="small"
      onClick={handleSaveButtonClick}
    >
      Save
    </Button>
  );
});

export { SketchAction };
