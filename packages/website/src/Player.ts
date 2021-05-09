import { componentType, distributorComponentInInput } from "./component";
import type { Sketch } from "./sketch";

type CoreInfiniteLoopDetectedEventHandler = (event: { player: Player }) => void;

const core = await import("core-wasm/core_wasm");

class Player {
  static coreComponentOutputLength = 8;

  #audioContext;
  #componentIndexMap: Map<string, number>;
  #onCoreInfiniteLoopDetected?: CoreInfiniteLoopDetectedEventHandler;

  constructor({
    sketch,
    onCoreInfiniteLoopDetected,
  }: {
    sketch: Sketch;
    onCoreInfiniteLoopDetected?: CoreInfiniteLoopDetectedEventHandler;
  }) {
    this.#audioContext = new AudioContext();
    this.#onCoreInfiniteLoopDetected = onCoreInfiniteLoopDetected;

    core.init(this.#audioContext.sampleRate);

    this.#componentIndexMap = new Map(
      Object.entries(sketch.component).map(([id, component]) => {
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
            return [id, core.create_component(component.implementation)];
          }

          case componentType.input:
          case componentType.keyboard:
          case componentType.speaker:
          case componentType.meter:
          case componentType.scope: {
            return [id, core.create_component(componentType.distributor)];
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
        const inputComponentIndex = this.#componentIndexMap.get(
          outputDestination.componentID
        );

        const outputComponentIndex = this.#componentIndexMap.get(id);

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

    Object.entries(sketch.component).forEach(([id, component]) => {
      switch (component.implementation) {
        case componentType.input: {
          this.inputValue({
            componentID: id,
            value: Number(component.extendedData.value),
          });

          break;
        }

        case componentType.speaker: {
          outputComponentIndex = this.#componentIndexMap.get(id);

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

    const scriptNode = this.#audioContext.createScriptProcessor(
      undefined,
      0,
      1
    );

    scriptNode.addEventListener("audioprocess", (event) => {
      if (outputComponentIndex === undefined) {
        return;
      }

      const bufferSize = event.outputBuffer.getChannelData(0).length;

      try {
        const buffer = core.process(bufferSize, outputComponentIndex);

        event.outputBuffer.copyToChannel(buffer, 0);
      } catch (exception: unknown) {
        if (exception === "CoreInfiniteLoopDetected") {
          this.#onCoreInfiniteLoopDetected?.({ player: this });
        } else {
          throw exception;
        }
      }
    });

    scriptNode.connect(this.#audioContext.destination);
  }

  close(): Promise<void> {
    return this.#audioContext.close();
  }

  inputValue({
    componentID,
    value,
  }: {
    componentID: string;
    value: number;
  }): void {
    const componentIndex = this.#componentIndexMap.get(componentID);

    if (componentIndex === undefined) {
      throw new Error();
    }

    try {
      core.input_value(componentIndex, distributorComponentInInput, value);
    } catch (exception: unknown) {
      if (exception === "CoreInfiniteLoopDetected") {
        this.#onCoreInfiniteLoopDetected?.({ player: this });
      } else {
        throw exception;
      }
    }
  }
}

export { Player };
export type { CoreInfiniteLoopDetectedEventHandler };
