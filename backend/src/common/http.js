import { ValidationError } from "./errors.js";

export function parseWithSchema(schema, payload) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new ValidationError("Request validation failed", result.error.flatten());
  }

  return result.data;
}
