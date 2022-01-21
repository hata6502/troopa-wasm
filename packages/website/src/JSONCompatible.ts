export type JSONCompatible<Target> = Target extends {
  toJSON: (...args: any) => any;
}
  ? JSONCompatible<ReturnType<Target["toJSON"]>>
  : // Infinity and NaN are not supported.
  Target extends boolean | null | number | string
  ? Target
  : Target extends ((...args: any) => any) | symbol | undefined
  ? never
  : Target extends unknown
  ? { [Key in keyof Target]: JSONCompatible<Target[Key]> }
  : unknown;

// Tests
{
  {
    const target = {
      object: {
        // Primitive types
        boolean: true,
        null: null,
        number: 1,
        string: "string",
        // Object types
        array: [true, [1]],
        date: new Date(),
        // Unsupported types
        infinity: Infinity,
        nan: NaN,
      },
    } as const;

    const typeCheck: {
      object: {
        // Primitive types
        boolean: true;
        null: null;
        number: 1;
        string: "string";
        // Object types
        array: readonly [true, readonly [1]];
        date: string; // Date.toJSON() returns string
        // Unsupported types
        infinity: number; // null is the correct type
        nan: number; // null is the correct type
      };
    } = JSON.parse(JSON.stringify(target)) as JSONCompatible<typeof target>;
  }

  {
    const target = (_number: number, _string: string) => true;

    const typeCheck: never = JSON.parse(
      JSON.stringify(target)
    ) as JSONCompatible<typeof target>;
  }

  {
    const target = undefined;

    const typeCheck: never = JSON.parse(
      JSON.stringify(target)
    ) as JSONCompatible<typeof target>;
  }

  {
    const target = Symbol();

    const typeCheck: never = JSON.parse(
      JSON.stringify(target)
    ) as JSONCompatible<typeof target>;
  }
}
