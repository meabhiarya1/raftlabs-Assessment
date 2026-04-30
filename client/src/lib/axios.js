import axios from "axios";
import { clientEnv } from "../config/env.js";

export const api = axios.create({
  baseURL: `${clientEnv.apiUrl}/api`,
  timeout: 15000,
  headers: {
    "x-api-key": clientEnv.apiKey
  }
});
