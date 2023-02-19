import { z } from "zod";

export const authenticationSettingsSchema = z.object({
  secret: z.string({ description: "The JWT signing secret" }),
  entity: z
    .string({
      description: "The name of the authentication entity (e.g. user)"
    })
    .optional(),
  entityId: z
    .string({
      description: "The name of the authentication entity id property"
    })
    .optional(),
  service: z
    .string({ description: "The path of the entity service" })
    .optional(),
  authStrategies: z.array(z.string(), {
    description:
      "A list of authentication strategy names that are allowed to create JWT access tokens"
  }),
  parseStrategies: z
    .array(z.string(), {
      description:
        "A list of authentication strategy names that should parse HTTP headers for authentication information (defaults to `authStrategies`)"
    })
    .optional(),
  jwtOptions: z.object({}).optional(),
  jwt: z
    .object({
      header: z
        .string({
          description: "The HTTP header containing the JWT"
        })
        .default("Authorization"),
      schemes: z.string({ description: "An array of schemes to support" })
    })
    .optional(),
  local: z
    .object({
      usernameField: z.string({
        description: "Name of the username field (e.g. `email`)"
      }),
      passwordField: z.string({
        description: "Name of the password field (e.g. `password`)"
      }),
      hashSize: z.number({ description: "The BCrypt salt length" }).optional(),
      errorMessage: z
        .string({ description: "The error message to return on errors" })
        .optional(),
      entityUsernameField: z
        .string({
          description:
            "Name of the username field on the entity if authentication request data and entity field names are different"
        })
        .optional(),
      entityPasswordField: z
        .string({
          description:
            "Name of the password field on the entity if authentication request data and entity field names are different"
        })
        .optional()
    })
    .optional(),
  oauth: z
    .object({
      redirect: z.string().optional(),
      origins: z.array(z.string()).optional(),
      defaults: z
        .object({
          key: z.string().optional(),
          secret: z.string().optional()
        })
        .optional()
    })
    .optional()
});

export const sqlSettingsSchema = z
  .object({
    client: z.string(),
    connection: z.union([
      z.string(),
      z
        .object({
          host: z.string(),
          port: z.number(),
          user: z.string(),
          password: z.string(),
          database: z.string()
        })
        .partial()
    ]),
    pool: z
      .object({
        min: z.number(),
        max: z.number()
      })
      .optional()
  })
  .optional();

export const defaultAppConfiguration = z.object({
  authentication: authenticationSettingsSchema.optional(),
  paginate: z
    .object({
      default: z.number(),
      max: z.number()
    })
    .optional(),
  origins: z.array(z.string()).optional(),
  mongodb: z.string().optional(),
  mysql: sqlSettingsSchema,
  postgresql: sqlSettingsSchema,
  sqlite: sqlSettingsSchema,
  mssql: sqlSettingsSchema
});

export type DefaultAppConfiguration = z.infer<typeof defaultAppConfiguration>;
