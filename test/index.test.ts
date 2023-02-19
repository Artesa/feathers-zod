import assert from "node:assert";
import { ObjectId as MongoObjectId } from "mongodb";

import {
  z,
  querySyntax,
  defaultAppConfiguration,
  objectIdSchema
} from "../src";

describe("feathers-zod", () => {
  describe("querySyntax", () => {
    it("basics", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      });
      const querySchema = querySyntax(schema);

      type Query = z.infer<typeof querySchema>;

      const query: Query = {
        name: "Dave",
        age: { $gt: 42, $in: [50, 51] },
        $select: ["age", "name"],
        $sort: {
          age: 1
        }
      };

      const validated1 = await querySchema.parseAsync(query);

      assert.ok(validated1);

      const validated2 = await querySchema.safeParseAsync({
        ...query,
        something: "wrong"
      });
      assert.ok(!validated2.success);
    });

    it("getQuerySchema works with no properties", async () => {
      const schema = querySyntax(z.object({}));
    });

    it("query syntax can include additional extensions", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      });
      const querySchema = querySyntax(schema, {
        age: {
          $notNull: z.boolean()
        },
        name: {
          $ilike: z.string()
        }
      });

      type Query = z.infer<typeof querySchema>;

      const query: Query = {
        age: {
          $gt: 10,
          $notNull: true
        },
        name: {
          $gt: "David",
          $ilike: "Dave"
        }
      };

      const validated = await querySchema.parseAsync(query);

      assert.ok(validated);
    });
  });

  it("defaultAppConfiguration", async () => {
    const configSchema = defaultAppConfiguration.merge(
      z.object({
        host: z.string(),
        port: z.number(),
        public: z.string()
      })
    );

    const validated = await configSchema.parseAsync({
      host: "something",
      port: 3030,
      public: "./"
    });

    assert.ok(validated);
  });

  // Test ObjectId validation
  it("ObjectId", async () => {
    const schema = z.object({
      _id: objectIdSchema()
    });

    const validated = await schema.parseAsync({
      _id: "507f191e810c19729de860ea"
    });
    assert.ok(validated);

    const validated2 = await schema.parseAsync({
      _id: new MongoObjectId()
    });
    assert.ok(validated2);
  });
});
