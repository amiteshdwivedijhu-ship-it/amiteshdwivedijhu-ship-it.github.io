import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const artifacts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/artifacts" }),
  schema: z.object({
    title: z.string(),
    hook: z.string(),
    project: z.string(),
    order: z.number(),
    source: z.string(),
  }),
});

const reports = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/reports" }),
  schema: z.object({
    title: z.string(),
    project: z.string(),
    source: z.string(),
  }),
});

export const collections = { artifacts, reports };
