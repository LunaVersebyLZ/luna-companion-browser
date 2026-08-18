import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchResults, fetchReadable } from "./search.server";

export const webSearch = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ query: z.string().min(1).max(300), engineId: z.string().max(40) }).parse(data),
  )
  .handler(async ({ data }) => fetchResults(data.query, data.engineId));

export const readPage = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ url: z.string().url() }).parse(data))
  .handler(async ({ data }) => fetchReadable(data.url));
