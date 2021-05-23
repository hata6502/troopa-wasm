import { distributorComponentInInput, primitiveComponentType } from "./component";
import type { Sketch } from "./sketch";

type CoreInfiniteLoopDetectedEventHandler = (event: {
  componentID: string;
}) => void;

const core = await import("core-wasm/core_wasm");

class Player {
  static coreComponentOutputLength = 8;

  private audioContext;
  private componentIndexMap: Map<string, number>;
  private onCoreInfiniteLoopDetected?: CoreInfiniteLoopDetectedEventHandler;

  constructor({ sketch }: { sketch: Sketch }) {
    this.audioContext = new AudioContext();

    core.init(this.audioContext.sampleRate);

    this.componentIndexMap = new Map(
      Object.entries(sketch.component).map(([id, component]) => {
        switch (component.implementation) {
          case primitiveComponentType.amplifier:
          case primitiveComponentType.buffer:
          case primitiveComponentType.differentiator:
          case primitiveComponentType.distributor:
          case primitiveComponentType.divider:
          case primitiveComponentType.integrator:
          case primitiveComponentType.lowerSaturator:
          case primitiveComponentType.mixer:
          case primitiveComponentType.noise:
          case primitiveComponentType.saw:
          case primitiveComponentType.sine:
          case primitiveComponentType.square:
          case primitiveComponentType.subtractor:
          case primitiveComponentType.triangle:
          case primitiveComponentType.upperSaturator: {
            return [id, core.create_component(component.implementation)];
          }

          case primitiveComponentType.input:
          case primitiveComponentType.keyboardFrequency:
          case primitiveComponentType.keyboardSwitch:
          case primitiveComponentType.speaker:
          case primitiveComponentType.meter:
          case primitiveComponentType.scope: {
            return [id, core.create_component(primitiveComponentType.distributor)];
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = component;

            throw new Error();
          }
        }
      })
    );

    Object.entries(sketch.component).forEach(([id, component]) =>
      component.outputDestinations.forEach((outputDestination) => {
        switch (outputDestination.type) {
          case "component": {
            const inputComponentIndex = this.componentIndexMap.get(
              outputDestination.id
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
              outputDestination.inputIndex,
              outputComponentIndex
            );

            break;
          }

          case "sketchOutput": {
            break;
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = outputDestination;

            throw new Error();
          }
        }
      })
    );

    let outputComponentIndex: number | undefined;

    Object.entries(sketch.component).forEach(([id, component]) => {
      switch (component.implementation) {
        case primitiveComponentType.input: {
          this.inputValue({
            componentID: id,
            value: Number(component.extendedData.value),
          });

          break;
        }

        case primitiveComponentType.speaker: {
          outputComponentIndex = this.componentIndexMap.get(id);

          break;
        }

        case primitiveComponentType.amplifier:
        case primitiveComponentType.buffer:
        case primitiveComponentType.differentiator:
        case primitiveComponentType.distributor:
        case primitiveComponentType.divider:
        case primitiveComponentType.integrator:
        case primitiveComponentType.lowerSaturator:
        case primitiveComponentType.mixer:
        case primitiveComponentType.noise:
        case primitiveComponentType.saw:
        case primitiveComponentType.sine:
        case primitiveComponentType.square:
        case primitiveComponentType.subtractor:
        case primitiveComponentType.triangle:
        case primitiveComponentType.upperSaturator:
        case primitiveComponentType.keyboardFrequency:
        case primitiveComponentType.keyboardSwitch:
        case primitiveComponentType.meter:
        case primitiveComponentType.scope: {
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
