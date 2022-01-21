import { Button } from "@material-ui/core";
import { FunctionComponent, memo, useCallback } from "react";
import { SketchV3 } from "../sketch";
import { filePickerOptions } from "../filePickerOptions";

const SketchAction: FunctionComponent<{
  sketch: SketchV3;
  componentName: string;
}> = memo(({ sketch, componentName }) => {
  const handleSaveButtonClick = useCallback(async () => {
    let fileHandle;

    try {
      fileHandle = await showSaveFilePicker({
        ...filePickerOptions,
        suggestedName: componentName,
      });
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
