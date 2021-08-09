import { Radio, makeStyles } from "@material-ui/core";
import { memo, useCallback, useMemo, useState } from "react";
import type { CSSProperties, FunctionComponent } from "react";
import { ArcherElement } from "react-archer";
import type { Relation } from "react-archer";
import { DraggableCore } from "react-draggable";
import type { DraggableData, DraggableEventHandler } from "react-draggable";

const useStyles = makeStyles(({ palette }) => ({
  radio: {
    backgroundColor: palette.background.paper,
    cursor: "alias",
    padding: 0,
  },
}));

const ConnectableAnchor: FunctionComponent<{
  id: string;
  relations?: Relation[];
  onDrag?: () => void;
  onStop?: DraggableEventHandler;
}> = memo(({ id, relations = [], onDrag, onStop }) => {
  const [connectionCuror, setConnectionCuror] = useState<DraggableData>();

  const classes = useStyles();

  const handleDrag: DraggableEventHandler = useCallback(
    (_event, data) => {
      setConnectionCuror(data);
      onDrag?.();
    },
    [onDrag]
  );

  const handleStop: DraggableEventHandler = useCallback(
    (event, data) => {
      setConnectionCuror(undefined);
      onStop?.(event, data);
    },
    [onStop]
  );

  const connectionCurorStyle = useMemo(
    (): CSSProperties | undefined =>
      connectionCuror && {
        position: "absolute",
        left: connectionCuror.x,
        top: connectionCuror.y,
      },
    [connectionCuror]
  );

  return (
    <>
      <DraggableCore
        onStart={handleDrag}
        onDrag={handleDrag}
        onStop={handleStop}
      >
        {/* DraggableCore target. */}
        <div className="cancel-component-container-drag">
          <ArcherElement
            id={`${id}-radio`}
            relations={[
              ...relations,
              ...(connectionCuror
                ? [
                    {
                      sourceAnchor: "right" as const,
                      targetAnchor: "left" as const,
                      targetId: `${id}-cursor`,
                    },
                  ]
                : []),
            ]}
          >
            <Radio checked={false} className={classes.radio} size="small" />
          </ArcherElement>
        </div>
      </DraggableCore>

      {connectionCurorStyle && (
        <ArcherElement id={`${id}-cursor`}>
          <div style={connectionCurorStyle} />
        </ArcherElement>
      )}
    </>
  );
});

export { ConnectableAnchor };
