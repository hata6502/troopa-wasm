import type { Dispatch, SetStateAction } from "react";
// @ts-expect-error The type declaration is not found.
import str2ab from "string-to-arraybuffer";
import inlineCore from "core-wasm/target/wasm32-unknown-unknown/release/core_wasm.wasm";
import { componentType, distributorComponentInInput } from "./component";
import type { SketchComponent } from "./component";
import type { ComponentDestination, Destination } from "./destination";
import { sketchComponentMaxLength } from "./sketch";
import type { Sketch } from "./sketch";

const bufferSize = 4096;

const returnCodeSuccess = 0;
const returnCodeInfiniteLoopDetected = 1;

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const core = await WebAssembly.instantiate(str2ab(inlineCore));

type CoreInfiniteLoopDetectedEventHandler = (event: {
  componentID: string;
}) => void;

type History = { sketch: Sketch; sketchComponent?: SketchComponent }[];

class Player {
  static coreComponentOutputLength = 8;

  private static createCoreComponents({
    sketch,
  }: {
    sketch: Sketch;
  }): [string, number][] {
    return Object.entries(sketch.component).flatMap(([id, component]) => {
      switch (component.type) {
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
          // @ts-expect-error Core type is not defined.
          const index = core.instance.exports["create_component"](
            component.type
          ) as number;

          return [[id, index]];
        }

        case componentType.input:
        case componentType.keyboardFrequency:
        case componentType.keyboardSwitch:
        case componentType.speaker:
        case componentType.meter: {
          // @ts-expect-error Core type is not defined.
          const index = core.instance.exports["create_component"](
            componentType.distributor
          ) as number;

          return [[id, index]];
        }

        case componentType.sketch: {
          return Player.createCoreComponents({
            sketch: component.extendedData.sketch,
          });
        }

        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const exhaustiveCheck: never = component;

          throw new Error();
        }
      }
    });
  }

  private static resolveDestination({
    destination,
    history,
  }: {
    destination: Destination;
    history: History;
  }): ComponentDestination[] {
    const currentHistory = history[history.length - 1];

    switch (destination.type) {
      case "component": {
        const inputComponent = new Map(
          Object.entries(currentHistory.sketch.component)
        ).get(destination.id);

        if (!inputComponent) {
          throw new Error();
        }

        switch (inputComponent.type) {
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
          case componentType.input:
          case componentType.keyboardFrequency:
          case componentType.keyboardSwitch:
          case componentType.speaker:
          case componentType.meter: {
            return [destination];
          }

          case componentType.sketch: {
            const sketchInputDestination =
              inputComponent.extendedData.sketch.inputs[destination.inputIndex]
                .destination;

            if (!sketchInputDestination) {
              throw new Error();
            }

            return Player.resolveDestination({
              destination: sketchInputDestination,
              history: [
                ...history,
                {
                  sketch: inputComponent.extendedData.sketch,
                  sketchComponent: inputComponent,
                },
              ],
            });
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = inputComponent;

            throw new Error();
          }
        }
      }

      case "sketchOutput": {
        const currentSketchComponent = currentHistory.sketchComponent;

        if (!currentSketchComponent) {
          return [];
        }

        return currentSketchComponent.outputDestinations.flatMap(
          (outputDestination) =>
            Player.resolveDestination({
              history: history.slice(0, history.length - 1),
              destination: outputDestination,
            })
        );
      }

      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveCheck: never = destination;

        throw new Error();
      }
    }
  }

  private audioContext;
  private componentIndexMap: Map<string, number>;
  private onCoreInfiniteLoopDetected?: CoreInfiniteLoopDetectedEventHandler;

  constructor({
    dispatchSketch,
    sketch,
  }: {
    dispatchSketch: Dispatch<SetStateAction<Sketch>>;
    sketch: Sketch;
  }) {
    this.audioContext = new AudioContext();

    // @ts-expect-error Core type is not defined.
    core.instance.exports["init"](this.audioContext.sampleRate);

    this.componentIndexMap = new Map(Player.createCoreComponents({ sketch }));
    this.connectCoreComponents({ history: [{ sketch }] });

    const outputComponentIds: string[] = [];

    const prepareInterfaces = ({ sketch }: { sketch: Sketch }) =>
      Object.entries(sketch.component).forEach(([id, component]) => {
        switch (component.type) {
          case componentType.input: {
            this.inputValue({
              componentID: id,
              value: Number(component.extendedData.value),
            });

            break;
          }

          case componentType.speaker:
          case componentType.meter: {
            outputComponentIds.push(id);

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
          case componentType.keyboardFrequency:
          case componentType.keyboardSwitch: {
            break;
          }

          case componentType.sketch: {
            prepareInterfaces({ sketch: component.extendedData.sketch });

            break;
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = component;

            throw new Error();
          }
        }
      });

    prepareInterfaces({ sketch });

    outputComponentIds.forEach((outputComponentId) => {
      const outputComponentIndex =
        this.componentIndexMap.get(outputComponentId);

      if (outputComponentIndex === undefined) {
        throw new Error();
      }

      // @ts-expect-error Core type is not defined.
      core.instance.exports["append_output_component_index"](
        outputComponentIndex
      );
    });

    const scriptNode = this.audioContext.createScriptProcessor(
      bufferSize,
      0,
      1
    );

    scriptNode.addEventListener("audioprocess", (event) => {
      // @ts-expect-error Core type is not defined.
      this.catchCoreException(core.instance.exports["process"]());

      outputComponentIds.forEach((outputComponentId, index) => {
        // @ts-expect-error Core type is not defined.
        const bufferAddress = core.instance.exports[
          "get_buffer_address"
        ]() as number;

        const bufferByteOffset =
          bufferAddress + Float32Array.BYTES_PER_ELEMENT * bufferSize * index;

        const buffer = new Float32Array(
          // @ts-expect-error Core type is not defined.
          core.instance.exports["memory"].buffer,
          bufferByteOffset,
          bufferSize
        );

        const outputComponent = new Map(Object.entries(sketch.component)).get(
          outputComponentId
        );

        if (!outputComponent) {
          // Components in sketch are not supported.
          return;
        }

        switch (outputComponent.type) {
          case componentType.speaker: {
            event.outputBuffer.copyToChannel(buffer, 0);

            break;
          }

          case componentType.meter: {
            if (buffer.length < 1) {
              throw new Error();
            }

            dispatchSketch((prevSketch) => ({
              ...prevSketch,
              component: {
                ...prevSketch.component,
                [outputComponentId]: {
                  ...outputComponent,
                  extendedData: {
                    value: buffer[0],
                  },
                },
              },
            }));

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
          case componentType.input:
          case componentType.keyboardFrequency:
          case componentType.keyboardSwitch:
          case componentType.sketch: {
            break;
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = outputComponent;

            throw new Error();
          }
        }
      });
    });

    scriptNode.connect(this.audioContext.destination);
  }

  close(): Promise<void> {
    return this.audioContext.close();
  }

  setCoreInfiniteLoopDetectedHandler(
    onCoreInfiniteLoopDetected?: CoreInfiniteLoopDetectedEventHandler
  ): void {
    this.onCoreInfiniteLoopDetected = onCoreInfiniteLoopDetected;
  }

  inputValue({
    componentID,
    value,
  }: {
    componentID: string;
    value: number;
  }): void {
    const componentIndex = this.componentIndexMap.get(componentID);

    if (componentIndex === undefined) {
      throw new Error();
    }

    this.catchCoreException(
      // @ts-expect-error Core type is not defined.
      core.instance.exports["input_value"](
        componentIndex,
        distributorComponentInInput,
        value
      )
    );
  }

  private catchCoreException(returnCode: number): void {
    if (returnCode === returnCodeSuccess) {
      return;
    }

    if (
      returnCode >= returnCodeInfiniteLoopDetected &&
      returnCode < returnCodeInfiniteLoopDetected + sketchComponentMaxLength
    ) {
      const componentIndex = returnCode - returnCodeInfiniteLoopDetected;

      const componentID = [...this.componentIndexMap.entries()].find(
        ([, index]) => index === componentIndex
      )?.[0];

      if (componentID === undefined) {
        throw new Error();
      }

      this.onCoreInfiniteLoopDetected?.({ componentID });

      return;
    }

    throw new Error(`Uncaught core exception: ${returnCode}`);
  }

  private connectCoreComponents({ history }: { history: History }) {
    const currentHistory = history[history.length - 1];

    Object.entries(currentHistory.sketch.component).forEach(([id, component]) =>
      component.outputDestinations.forEach((outputDestination) => {
        switch (component.type) {
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
          case componentType.input:
          case componentType.keyboardFrequency:
          case componentType.keyboardSwitch:
          case componentType.speaker:
          case componentType.meter: {
            const resolvedDestinations = Player.resolveDestination({
              destination: outputDestination,
              history,
            });

            resolvedDestinations.forEach((resolvedDestination) => {
              const inputComponentIndex = this.componentIndexMap.get(
                resolvedDestination.id
              );

              const outputComponentIndex = this.componentIndexMap.get(id);

              if (
                inputComponentIndex === undefined ||
                outputComponentIndex === undefined
              ) {
                throw new Error();
              }

              // @ts-expect-error Core type is not defined.
              core.instance.exports["connect"](
                inputComponentIndex,
                resolvedDestination.inputIndex,
                outputComponentIndex
              );
            });

            break;
          }

          case componentType.sketch: {
            this.connectCoreComponents({
              history: [
                ...history,
                {
                  sketch: component.extendedData.sketch,
                  sketchComponent: component,
                },
              ],
            });

            break;
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = component;

            throw new Error();
          }
        }
      })
    );
  }
}

export { Player };
