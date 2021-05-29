import { componentType, distributorComponentInInput } from "./component";
import type { SketchComponent } from "./component";
import type { ComponentDestination, Destination } from "./destination";
import type { Sketch } from "./sketch";

type CoreInfiniteLoopDetectedEventHandler = (event: {
  componentID: string;
}) => void;

const core = await import("core-wasm/core_wasm");

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
    history: { sketch: Sketch; sketchComponent?: SketchComponent }[];
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

  constructor({ sketch }: { sketch: Sketch }) {
    this.audioContext = new AudioContext();

    core.init(this.audioContext.sampleRate);

    this.componentIndexMap = new Map(Player.createCoreComponents({ sketch }));

    Object.entries(sketch.component).forEach(([id, component]) =>
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
              history: [{ sketch }],
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

    let outputComponentIndex: number | undefined;

    Object.entries(sketch.component).forEach(([id, component]) => {
      switch (component.type) {
        case componentType.input: {
          this.inputValue({
            componentID: id,
            value: Number(component.extendedData.value),
          });

          break;
        }

        case componentType.speaker: {
          outputComponentIndex = this.componentIndexMap.get(id);

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
        case componentType.meter:
        case componentType.scope:
        case componentType.sketch: {
          break;
        }

        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const exhaustiveCheck: never = component;

          throw new Error();
        }
      }
    });

    const scriptNode = this.audioContext.createScriptProcessor(undefined, 0, 1);

    scriptNode.addEventListener("audioprocess", (event) => {
      if (outputComponentIndex === undefined) {
        return;
      }

      const bufferSize = event.outputBuffer.getChannelData(0).length;

      try {
        const buffer = core.process(bufferSize, outputComponentIndex);

        event.outputBuffer.copyToChannel(buffer, 0);
      } catch (exception: unknown) {
        this.catchCoreException(exception);
      }
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
}

export { Player };
