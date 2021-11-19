import { Radio, makeStyles } from "@material-ui/core";
import {
  CSSProperties,
  FunctionComponent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ArcherElement, Relation } from "react-archer";
import {
  DraggableCore,
  DraggableData,
  DraggableEventHandler,
} from "react-draggable";

const arrowLength = 40;

const useStyles = makeStyles(({ palette }) => ({
  radio: {
    backgroundColor: palette.background.paper,
    cursor: "alias",
    padding: 0,
  },
}));

type AnchorlessRelation = Omit<Relation, "sourceAnchor" | "targetAnchor">;

const detectAnchors = ({
  sourceCenterX,
  sourceCenterY,
  targetCenterX,
  targetCenterY,
}: {
  sourceCenterX: number;
  sourceCenterY: number;
  targetCenterX: number;
  targetCenterY: number;
}): Pick<Relation, "sourceAnchor" | "targetAnchor"> => {
  if (Math.abs(sourceCenterX - targetCenterX) >= arrowLength) {
    return sourceCenterX < targetCenterX
      ? {
          sourceAnchor: "right",
          targetAnchor: "left",
        }
      : {
          sourceAnchor: "left",
          targetAnchor: "right",
        };
  }

  if (Math.abs(sourceCenterY - targetCenterY) >= arrowLength) {
    return sourceCenterY < targetCenterY
      ? {
          sourceAnchor: "bottom",
          targetAnchor: "top",
        }
      : {
          sourceAnchor: "top",
          targetAnchor: "bottom",
        };
  }

  return {
    sourceAnchor: "middle",
    targetAnchor: "middle",
  };
};

const getRelations = ({
  anchorlessRelations,
  sourceId,
}: {
  anchorlessRelations: AnchorlessRelation[];
  sourceId: string;
}) => {
  const sourceElement = document.getElementById(sourceId);

  if (!sourceElement) {
    throw new Error(`Could not find element with id "${sourceId}"`);
  }

  const soruceDOMRect = sourceElement.getBoundingClientRect();
  const sourceCenterX = soruceDOMRect.left + soruceDOMRect.width / 2;
  const sourceCenterY = soruceDOMRect.top + soruceDOMRect.height / 2;

  return anchorlessRelations.map((anchorlessRelation): Relation => {
    const targetElement = document.getElementById(anchorlessRelation.targetId);

    if (!targetElement) {
      throw new Error(
        `Could not find element with id "${anchorlessRelation.targetId}"`
      );
    }

    const targetDOMRect = targetElement.getBoundingClientRect();
    const targetCenterX = targetDOMRect.left + targetDOMRect.width / 2;
    const targetCenterY = targetDOMRect.top + targetDOMRect.height / 2;

    return {
      ...anchorlessRelation,
      ...detectAnchors({
        sourceCenterX,
        sourceCenterY,
        targetCenterX,
        targetCenterY,
      }),
    };
  });
};

const ConnectableAnchor: FunctionComponent<{
  id: string;
  anchorlessRelations?: AnchorlessRelation[];
  disabled?: boolean;
  onStop?: DraggableEventHandler;
}> = memo(({ id, anchorlessRelations = [], disabled, onStop }) => {
  const [connectionCuror, setConnectionCuror] = useState<DraggableData>();
  const [relations, setRelations] = useState<Relation[]>([]);

  const classes = useStyles();

  const cursorID = `${id}-cursor`;
  const radioID = `${id}-radio`;

  useEffect(() => {
    const handle = () =>
      setRelations(
        getRelations({
          anchorlessRelations: [
            ...anchorlessRelations,
            ...(connectionCuror ? [{ targetId: cursorID }] : []),
          ],
          sourceId: radioID,
        })
      );

    handle();

    const intervalID = setInterval(handle, 200);

    return () => clearInterval(intervalID);
  }, [anchorlessRelations, connectionCuror, cursorID, radioID]);

  const handleDrag: DraggableEventHandler = useCallback(
    (_event, data) => setConnectionCuror(data),
    []
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
        disabled={disabled}
        onStart={handleDrag}
        onDrag={handleDrag}
        onStop={handleStop}
      >
        {/* DraggableCore target. */}
        <div className="cancel-component-container-drag">
          <ArcherElement id={radioID} relations={relations}>
            <Radio
              id={radioID}
              checked={false}
              className={classes.radio}
              disabled={disabled}
              size="small"
            />
          </ArcherElement>
        </div>
      </DraggableCore>

      {connectionCurorStyle && (
        <ArcherElement id={cursorID}>
          <div id={cursorID} style={connectionCurorStyle} />
        </ArcherElement>
      )}
    </>
  );
});

export { ConnectableAnchor };
