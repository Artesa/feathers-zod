import { z } from "zod";
import { ObjectId } from "mongodb";

export const objectIdSchema = () =>
  z
    .instanceof(ObjectId)
    .optional()
    .or(
      z.string().transform((input, ctx) => {
        try {
          return ObjectId.createFromHexString(input);
        } catch (error) {
          ctx.addIssue({
            message: error.message,
            code: z.ZodIssueCode.custom,
            params: { input }
          });
        }
      })
    );

export * from "zod";
export * from "./query";
export * from "./hooks/validate";
export * from "./default-schemas";
