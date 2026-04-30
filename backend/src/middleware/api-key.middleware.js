import { UnauthorizedError } from "../common/errors.js";
import { API_KEY_HEADER } from "../config/constant.js";
import { env } from "../config/env.js";

function getApiKeyFromHeaders(headers) {
  const headerValue = headers[API_KEY_HEADER];

  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }

  return headerValue;
}

export async function verifyApiKey(request) {
  const apiKey = getApiKeyFromHeaders(request.headers);

  if (!apiKey) {
    throw new UnauthorizedError(`Missing ${API_KEY_HEADER} header.`);
  }

  if (apiKey !== env.API_KEY) {
    throw new UnauthorizedError("Invalid API key.");
  }
}
