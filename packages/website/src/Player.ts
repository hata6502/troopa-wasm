import type { Dispatch, SetStateAction } from "react";
import coreURL from "core-wasm/target/wasm32-unknown-unknown/release/core_wasm.wasm";
import { componentType, distributorComponentInInput } from "./component";
import type { SketchComponent } from "./component";
import type { ComponentDestination, Destination } from "./destination";
import type { Sketch } from "./sketch";

const coreResponse = await fetch(coreURL);

const core = await WebAssembly.instantiate(
  await coreResponse.arrayBuffer(),
  {}
);

console.log(core);

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
          return [[id, core.create_component(component.type)]];
        }

        case componentType.input:
        case componentType.keyboardFrequency:
        case componentType.keyboardSwitch:
        case componentType.speaker:
        case componentType.meter:
        case componentType.scope: {
          return [[id, core.create_component(componentType.distributor)]];
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
          case componentType.meter:
          case componentType.scope: {
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
    core.init(this.audioContext.sampleRate);
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
          case componentType.keyboardSwitch:
          case componentType.scope: {
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

    const outputComponentIndexes = outputComponentIds.map(
      (outputComponentId) => {
        const outputComponentIndex =
          this.componentIndexMap.get(outputComponentId);

        if (outputComponentIndex === undefined) {
          throw new Error();
        }

        return outputComponentIndex;
      }
    );

    const scriptNode = this.audioContext.createScriptProcessor(undefined, 0, 1);

    scriptNode.addEventListener("audioprocess", (event) => {
      const bufferSize = event.outputBuffer.getChannelData(0).length;

      let buffers: Float32Array | undefined;

      try {
        buffers = core.process(
          bufferSize,
          new Uint32Array(outputComponentIndexes)
        );
      } catch (exception: unknown) {
        this.catchCoreException(exception);
      }

      outputComponentIds.forEach((outputComponentId, index) => {
        if (!buffers) {
          throw new Error();
        }

        const buffer = buffers.filter(
          (_buffer, bufferIndex) =>
            bufferIndex % outputComponentIds.length === index
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
          case componentType.scope:
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

    try {
      core.input_value(componentIndex, distributorComponentInInput, value);
    } catch (exception: unknown) {
      this.catchCoreException(exception);
    }
  }

  private catchCoreException(exception: unknown): void {
    if (typeof exception === "string") {
      const matchArray = /^CoreInfiniteLoopDetected (\d+)$/.exec(exception);

      if (matchArray) {
        const componentIndex = Number(matchArray[1]);

        const componentID = [...this.componentIndexMap.entries()].find(
          ([, index]) => index === componentIndex
        )?.[0];

        if (componentID === undefined) {
          throw new Error();
        }

        this.onCoreInfiniteLoopDetected?.({ componentID });

        return;
      }
    }

    throw exception;
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
          case componentType.meter:
          case componentType.scope: {
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

              core.connect(
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
