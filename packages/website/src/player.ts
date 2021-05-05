import { componentType, distributorComponentInInput } from "./component";
import type { Component } from "./component";
import type { Sketch } from "./sketch";

const core = await import("core-wasm/core_wasm");

interface Player {
  audioContext: AudioContext;
  componentIndexMap: Map<Component["id"], number>;
}

const inputValueToPlayer = ({
  player,
  componentID,
  value,
}: {
  player: Player;
  componentID: Component["id"];
  value: number;
}): void => {
  const componentIndex = player.componentIndexMap.get(componentID);

  if (componentIndex === undefined) {
    throw new Error();
  }

  core.input_value(componentIndex, distributorComponentInInput, value);
};

const initPlayer = ({ sketch }: { sketch: Sketch }): Player => {
  const audioContext = new AudioContext();

  core.init(audioContext.sampleRate);

  const componentIndexMap = new Map(
    sketch.components.map((component) => {
      switch (component.implementation) {
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
        case componentType.upperSaturator: {
          return [
            component.id,
            core.create_component(component.implementation),
          ];
        }

        case componentType.input:
        case componentType.keyboard:
        case componentType.speaker:
        case componentType.meter:
        case componentType.scope: {
          return [
            component.id,
            core.create_component(componentType.distributor),
          ];
        }

        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const exhaustiveCheck: never = component;

          throw new Error();
        }
      }
    })
  );

  const player: Player = { audioContext, componentIndexMap };

  sketch.components.forEach((component) =>
    component.outputDestinations.forEach((outputDestination) => {
      const inputComponentIndex = componentIndexMap.get(
        outputDestination.componentID
      );

      const outputComponentIndex = componentIndexMap.get(component.id);

      if (
        inputComponentIndex === undefined ||
        outputComponentIndex === undefined
      ) {
        throw new Error();
      }

      core.connect(
        inputComponentIndex,
        outputDestination.inputIndex,
        outputComponentIndex
      );
    })
  );

  let outputComponentIndex: number | undefined;

  sketch.components.forEach((component) => {
    switch (component.implementation) {
      case componentType.input: {
        inputValueToPlayer({
          player,
          componentID: component.id,
          value: Number(component.extendedData.value),
        });

        break;
      }

      case componentType.speaker: {
        outputComponentIndex = componentIndexMap.get(component.id);

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
      case componentType.meter:
      case componentType.scope: {
        break;
      }

      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveCheck: never = component;

        throw new Error();
      }
    }
  });

  const scriptNode = audioContext.createScriptProcessor(undefined, 0, 1);

  scriptNode.addEventListener("audioprocess", (event) => {
    if (outputComponentIndex === undefined) {
      return;
    }

    const bufferSize = event.outputBuffer.getChannelData(0).length;
    const buffer = core.process(bufferSize, outputComponentIndex);

    event.outputBuffer.copyToChannel(buffer, 0);
  });

  scriptNode.connect(audioContext.destination);

  return player;
};

const closePlayer = ({ player }: { player: Player }): Promise<void> =>
  player.audioContext.close();

export { initPlayer, closePlayer, inputValueToPlayer };
export type { Player };
