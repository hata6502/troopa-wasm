import { Dispatch, SetStateAction } from "react";
import * as core from "core-wasm";
import {
  SketchComponent,
  componentType,
  distributorComponentInInput,
} from "./component";
import { ComponentDestination, Destination } from "./destination";
import { SketchV3 } from "./sketch";

const bufferSize = 4096;

const returnCodeSuccess = 0;
const returnCodeInfiniteLoopDetected = 1;

type CoreInfiniteLoopDetectedEventHandler = (event: {
  componentID: string;
}) => void;

type Scope = { sketch: SketchV3; sketchComponent?: SketchComponent };

class Player {
  private static createCoreComponents({
    sketch,
  }: {
    sketch: SketchV3;
  }): [string, number][] {
    return sketch.componentEntries.flatMap(([id, component]) => {
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
        case componentType.and:
        case componentType.not:
        case componentType.or: {
          return [[id, core.create_component(component.type)]];
        }

        case componentType.input:
        case componentType.keyboardFrequency:
        case componentType.keyboardSwitch:
        case componentType.speaker:
        case componentType.meter: {
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
    scopes,
  }: {
    destination: Destination;
    scopes: Scope[];
  }): ComponentDestination[] {
    const currentScope = scopes[scopes.length - 1];

    switch (destination.type) {
      case "component": {
        const inputComponent = new Map(
          currentScope.sketch.componentEntries
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
          case componentType.and:
          case componentType.not:
          case componentType.or:
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
              scopes: [
                ...scopes,
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

      case "output": {
        const currentSketchComponent = currentScope.sketchComponent;

        if (!currentSketchComponent) {
          return [];
        }

        return currentSketchComponent.outputDestinationsList[
          destination.index
        ].flatMap((outputDestination) =>
          Player.resolveDestination({
            destination: outputDestination,
            scopes: scopes.slice(0, scopes.length - 1),
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
  private dispatchSketch;
  private outputComponentIds: string[];
  private sketch;
  private onCoreInfiniteLoopDetected?: CoreInfiniteLoopDetectedEventHandler;

  constructor({
    dispatchSketch,
    sketch,
  }: {
    dispatchSketch: Dispatch<SetStateAction<SketchV3>>;
    sketch: SketchV3;
  }) {
    this.audioContext = new AudioContext();
    this.dispatchSketch = dispatchSketch;
    this.sketch = sketch;

    core.initialize(this.audioContext.sampleRate);

    this.componentIndexMap = new Map(
      Player.createCoreComponents({ sketch: this.sketch })
    );
    this.connectComponents({ scopes: [{ sketch: this.sketch }] });

    this.outputComponentIds = [];
    this.prepareInterfaces({ scopes: [{ sketch: this.sketch }] });

    this.outputComponentIds.forEach((outputComponentId) => {
      const outputComponentIndex =
        this.componentIndexMap.get(outputComponentId);

      if (outputComponentIndex === undefined) {
        throw new Error();
      }

      core.append_output_component_index(outputComponentIndex);
    });

    const scriptNode = this.audioContext.createScriptProcessor(
      bufferSize,
      0,
      1
    );

    scriptNode.addEventListener("audioprocess", this.handleAudioprocess);

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
      core.input_value(componentIndex, distributorComponentInInput, value)
    );
  }

  private catchCoreException(returnCode: number): void {
    if (returnCode === returnCodeSuccess) {
      return;
    }

    if (returnCode >= returnCodeInfiniteLoopDetected) {
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

  private connectComponents({ scopes }: { scopes: Scope[] }) {
    const currentScope = scopes[scopes.length - 1];

    currentScope.sketch.componentEntries.forEach(([id, component]) => {
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
        case componentType.and:
        case componentType.not:
        case componentType.or:
        case componentType.input:
        case componentType.keyboardFrequency:
        case componentType.keyboardSwitch:
        case componentType.speaker:
        case componentType.meter: {
          component.outputDestinationsList[0].forEach((outputDestination) => {
            const resolvedDestinations = Player.resolveDestination({
              destination: outputDestination,
              scopes,
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
          });

          break;
        }

        case componentType.sketch: {
          this.connectComponents({
            scopes: [
              ...scopes,
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
    });
  }

  private prepareInterfaces({ scopes }: { scopes: Scope[] }) {
    const currentScope = scopes[scopes.length - 1];

    currentScope.sketch.componentEntries.forEach(([id, component]) => {
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
          if (currentScope.sketchComponent) {
            break;
          }

          this.outputComponentIds.push(id);

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
        case componentType.and:
        case componentType.not:
        case componentType.or:
        case componentType.keyboardFrequency:
        case componentType.keyboardSwitch: {
          break;
        }

        case componentType.sketch: {
          this.prepareInterfaces({
            scopes: [
              ...scopes,
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
    });
  }

  private handleAudioprocess = (event: AudioProcessingEvent) => {
    this.catchCoreException(core.process());

    const buffer = core.get_buffer();
    const componentMap = new Map(this.sketch.componentEntries);

    this.outputComponentIds.forEach((outputComponentId, index) => {
      const outputComponentBuffer = buffer.slice(
        bufferSize * index,
        bufferSize * (index + 1)
      );

      const outputComponent = componentMap.get(outputComponentId);

      if (!outputComponent) {
        // Components in sketch are not supported.
        return;
      }

      switch (outputComponent.type) {
        case componentType.speaker: {
          event.outputBuffer.copyToChannel(
            Float32Array.from(outputComponentBuffer),
            0
          );

          break;
        }

        case componentType.meter: {
          if (outputComponentBuffer.length < 1) {
            throw new Error();
          }

          this.dispatchSketch((prevSketch) => ({
            ...prevSketch,
            componentEntries: [
              ...new Map(prevSketch.componentEntries)
                .set(outputComponentId, {
                  ...outputComponent,
                  extendedData: {
                    value: outputComponentBuffer[0],
                  },
                })
                .entries(),
            ],
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
        case componentType.and:
        case componentType.not:
        case componentType.or:
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
  };
}

export { Player };
