import {
  Card,
  CardActions,
  CardContent,
  TextField,
  Typography,
  makeStyles
} from "@material-ui/core";
import type { FunctionComponent, ReactNode } from "react";
import {  ArcherElement } from "react-archer";
import Draggable from "react-draggable";
import type { DraggableEventHandler } from "react-draggable";
import {inputValueToPlayer} from './player';
import type {Player} from './player';
import {componentInputNames, componentType, diffTimeInput} from './componentInfo';
import type {ComponentData} from './componentInfo';

const useStyles = makeStyles({
  card: {
    cursor: "move",
    width: 160,
  },
});

const Component: FunctionComponent<{
  data: ComponentData;
  player?: Player;
  onDrag?: DraggableEventHandler;
}> = ({ data, player, onDrag }) => {
  const classes = useStyles();

  let actionNode: ReactNode;

  switch (data.implementation) {
    case componentType.input: {
      actionNode = (
        <TextField
          // TODO: control
          defaultValue={data.extendedData.value}
          onChange={(event) => {
            if (!player) {
              return;
            }

            // TODO: update sketch
            inputValueToPlayer({
              player,
              componentID: data.id,
              value: Number(event.target.value),
            });
          }}
        />
      );

      break;
    }

    case componentType.amplifier:
    case componentType.buffer:
    case componentType.differentiator:
    case componentType.distributor:
    case componentType.divider:
    case componentType.integrator:
    case componentType.lowerSaturator:
    case componentType.mixer:
    case componentType.noise:
    case componentType.saw:
    case componentType.sine:
    case componentType.square:
    case componentType.subtractor:
    case componentType.triangle:
    case componentType.upperSaturator:
    case componentType.keyboard:
    case componentType.speaker:
    case componentType.meter:
    case componentType.scope: {
      break;
    }

    default: {
      const exhaustiveCheck: never = data;

      throw new Error();
    }
  }

  return (
    <Draggable onStart={onDrag} onDrag={onDrag} onStop={onDrag}>
      <Card className={classes.card}>
        <ArcherElement
          id={`${data.id}-output`}
          relations={data.outputDestinations.map((outputDestination) => ({
            sourceAnchor: "right",
            targetId: `${outputDestination.componentID}-input-${outputDestination.inputIndex}`,
            targetAnchor: "left",
          }))}
        >
          {/* ArcherElement can have only single child. */}
          <div>
            <CardContent>
              <Typography variant="body1" gutterBottom>
                {data.name}
              </Typography>

              {componentInputNames[data.implementation].flatMap(
                (inputName, index) => {
                  if ([diffTimeInput].includes(index)) {
                    return [];
                  }

                  return [
                    <ArcherElement id={`${data.id}-input-${index}`} key={index}>
                      <Typography variant="body2" gutterBottom>
                        {inputName}
                      </Typography>
                    </ArcherElement>,
                  ];
                }
              )}
            </CardContent>

            <CardActions>{actionNode}</CardActions>
          </div>
        </ArcherElement>
      </Card>
    </Draggable>
  );
};

export {Component};
