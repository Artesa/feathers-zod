import { expect } from "vitest";
import { getQuerySchema, validateQuery, validateData } from "../src";
import { z } from "zod";

describe("index.test.ts", function () {
  const schema = z.object({
    name: z.string(),
    age: z.number()
  });

  const querySchema = getQuerySchema(schema);

  it("get started", async () => {
    const context = { params: { query: { name: "John" } } };
    await validateQuery(querySchema)(context);

    expect(context.params.query).toEqual({ name: "John" });
  });

  it("fails for wrong type", async () => {
    const context = { params: { query: { name: 1 } } };
    await expect(validateQuery(querySchema)(context)).rejects.toThrow(
      "Expected string, received number"
    );
  });
});
