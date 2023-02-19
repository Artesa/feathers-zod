import { z } from "zod";

type KeysOf<Shape extends z.ZodRawShape> = Extract<keyof Shape, string>;

type SortDefinition<Shape extends z.ZodRawShape> = Record<
  KeysOf<Shape>,
  typeof order
>;
const order = z.union([z.literal(1), z.literal(-1)]).optional();

/**
 * Creates the `$sort` Feathers query syntax schema for an object schema
 *
 * @param schema The TypeBox object schema
 * @returns The `$sort` syntax schema
 */
export function sortDefinition<Shape extends z.ZodRawShape>(shape: Shape) {
  const properties = Object.keys(shape).reduce(
    (acc, key) => ({
      ...acc,
      [key]: order
    }),
    {}
  ) as SortDefinition<Shape>;

  return z.object(properties);
}

const arrayOfKeys = <Shape extends z.ZodRawShape>(shape: Shape) => {
  const keys = Object.keys(shape) as [KeysOf<Shape>];

  return z.enum(keys).array();
};

/**
 * Creates a zod schema for the complete Feathers query syntax including `$limit`, $skip`, `$or`, `$and`
 * and `$sort` and `$select` for the allowed properties.
 *
 * @param type The properties to create the query syntax for
 * @returns A TypeBox object representing the complete Feathers query syntax for the given properties
 */
export const querySyntax = <
  Schema extends z.AnyZodObject,
  Shape extends Schema["shape"],
  X extends {
    [K in KeysOf<Shape>]?: { [key: string]: z.ZodTypeAny };
  } = {}
>(
    schema: Schema,
    extensions: X = {} as X
  ) => {
  const shape = schema.shape as Shape;
  const propertySchemaShape = queryPropertiesShape(shape, extensions);
  const propertySchema = z.object(propertySchemaShape).strict();

  const $or = z.array(propertySchema).optional();
  const $and = z.array(z.union([propertySchema, z.object({ $or })])).optional();

  return z
    .object({
      $select: arrayOfKeys(shape).optional(),
      $sort: sortDefinition(shape).optional(),
      $limit: z.number().min(-1).optional(),
      $skip: z.number().min(0).optional(),
      $or,
      $and,
      ...propertySchemaShape
    })
    .strict();
};

export const queryProperty = <
  T extends z.ZodTypeAny,
  X extends { [key: string]: z.ZodTypeAny } = {}
>(
    prop: T,
    extension: X = {} as X
  ) => {
  const nullishProp = prop.nullish();
  const propOptional = prop.optional();
  return z.union([
    nullishProp,
    z
      .object({
        $ne: nullishProp,
        $gt: propOptional,
        $gte: propOptional,
        $lt: propOptional,
        $lte: propOptional,
        $in: z.array(nullishProp).optional(),
        $nin: z.array(nullishProp).optional(),
        ...extension
      })
      .strict()
  ]);
};

export type QueryProperty<
  T extends z.ZodTypeAny,
  X extends { [key: string]: z.ZodTypeAny }
> = ReturnType<typeof queryProperty<T, X>>;

export type QueryPropertiesShape<
  Shape extends z.ZodRawShape,
  X extends {
    [K in KeysOf<Shape>]?: { [key: string]: z.ZodTypeAny };
  }
> = {
  [K in KeysOf<Shape>]?: QueryProperty<Shape[K], X[K]>;
};

/**
 * Creates a Feathers query syntax schema for the properties defined in `definition`.
 *
 * @param definition The properties to create the Feathers query syntax schema for
 * @returns The Feathers query syntax schema
 */
export const queryPropertiesShape = <
  Shape extends z.ZodRawShape,
  X extends {
    [K in KeysOf<Shape>]?: { [key: string]: z.ZodTypeAny };
  } = {}
>(
    shape: Shape,
    extensions: X = {} as X
  ): QueryPropertiesShape<Shape, X> => {
  const keys = Object.keys(shape) as [KeysOf<Shape>];

  const definition = keys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: queryProperty(shape[key], extensions[key])
    }),
    {} as QueryPropertiesShape<Shape, X>
  );

  return definition;
};
