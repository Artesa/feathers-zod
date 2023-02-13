import { z } from "zod";

type KeyOf<T> = Extract<keyof T, string>;

const order = z.union([z.literal(1), z.literal(-1)]).optional();

const arrayOfKeys = <T extends z.ZodRawShape, Schema extends z.ZodObject<T>>(
  schema: Schema
) => {
  const keys = Object.keys(schema.shape) as [KeyOf<(typeof schema)["shape"]>];

  return z.enum(keys).array();
};

/**
 * Creates a zod schema for the complete Feathers query syntax including `$limit`, $skip`, `$or`
 * and `$sort` and `$select` for the allowed properties.
 *
 * @param type The properties to create the query syntax for
 * @returns A TypeBox object representing the complete Feathers query syntax for the given properties
 */
export const getQuerySchema = <
  T extends z.ZodRawShape,
  Schema extends z.ZodObject<T>
>(
    schema: Schema
  ) => {
  const keys = Object.keys(schema.shape) as [KeyOf<(typeof schema)["shape"]>];
  const $select = arrayOfKeys(schema).optional();

  const orders = keys.reduce((acc, key) => {
    return {
      ...acc,
      [key]: order
    };
  }, {} as Record<KeyOf<(typeof schema)["shape"]>, typeof order>);

  const queryProps = withOrAnd(queryProperties(schema));

  return z.object({
    $select,
    $sort: z.object(orders).optional(),
    $limit: z.number().optional(),
    $skip: z.number().optional(),
    ...queryProps
  });
};

const withOrAnd = <T extends z.ZodRawShape>(shape: T) => {
  const schema = z.object(shape);

  const schemas = z.array(schema).optional();

  const withOr = {
    $or: schemas,
    ...shape
  };
  const withAnd = {
    $and: schemas,
    ...shape
  };

  return {
    $or: z.array(z.object(withAnd)).optional(),
    $and: z.array(z.object(withOr)).optional(),
    ...shape
  };
};

const queryProperty = <T extends z.ZodTypeAny>(prop: T) => {
  const nullishProp = prop.nullish();
  return z.union([
    nullishProp,
    z.object({
      $ne: nullishProp,
      $gt: nullishProp,
      $gte: nullishProp,
      $lt: nullishProp,
      $lte: nullishProp,
      $in: z.array(nullishProp),
      $nin: z.array(nullishProp)
    })
  ]);
};

type QueryProperty<T extends z.ZodTypeAny> = ReturnType<
  typeof queryProperty<T>
>;

/**
 * Creates a Feathers query syntax schema for the properties defined in `definition`.
 *
 * @param definition The properties to create the Feathers query syntax schema for
 * @returns The Feathers query syntax schema
 */
export const queryProperties = <
  T extends z.ZodRawShape,
  Schema extends z.ZodObject<T>,
  Shape extends Schema["shape"]
>(
    schema: Schema
  ) => {
  const keys = Object.keys(schema.shape) as [KeyOf<Shape>];
  const { shape } = schema;

  const definition = keys.reduce(
    (acc, key) => {
      return {
        ...acc,
        [key]: queryProperty(shape[key])
      };
    },
    {} as {
      [K in KeyOf<Shape>]?: QueryProperty<Shape[K]>;
    }
  );

  return definition;
};
