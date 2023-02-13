import type { HookContext, NextFunction } from "@feathersjs/feathers";
import { z } from "zod";
import { VALIDATED } from "@feathersjs/adapter-commons";
import { BadRequest } from "@feathersjs/errors/lib";

export const validateQuery =
  <H extends HookContext>(schema: z.ZodTypeAny) =>
    async (context: H, next?: NextFunction) => {
      const { query: data } = context.params;

      try {
        const query = await schema.parseAsync(data);

        Object.defineProperty(query, VALIDATED, { value: true });

        context.params = {
          ...context.params,
          query
        };
      } catch (error: any) {
        throw error instanceof z.ZodError
          ? new BadRequest(error.message, error.issues)
          : error;
      }

      if (typeof next === "function") {
        return next();
      }
    };

export const validateData =
  <H extends HookContext>(schema: z.ZodTypeAny) =>
    async (context: H, next?: NextFunction) => {
      const { data } = context;

      try {
        if (Array.isArray(data)) {
          context.data = await Promise.all(
            data.map((item) => schema.parseAsync(item))
          );
        } else {
          context.data = await schema.parseAsync(data);
        }

        Object.defineProperty(context.data, VALIDATED, { value: true });
      } catch (error: any) {
        throw error instanceof z.ZodError
          ? new BadRequest(error.message, error.issues)
          : error;
      }

      if (typeof next === "function") {
        return next();
      }
    };
