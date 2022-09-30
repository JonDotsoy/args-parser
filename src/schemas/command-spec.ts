import { z } from "zod";

export type Handler = <
  A extends unknown[] = unknown[],
  B extends Record<string, unknown> = Record<string, unknown>,
>(
  args: A,
  options: B,
  parsed: CommandParsedSpec,
) => void | Promise<void>;

export const Handler: z.ZodType<Handler> = z.function(
  z.tuple([
    z.array(z.any()),
    z.record(z.any()),
    z.lazy(() => CommandParsedSpec),
  ]),
  z.union([
    z.promise(z.void()),
    z.void(),
  ]),
);

export interface SingleArgumentSpec<
  A extends z.Schema = z.Schema<unknown, z.ZodTypeDef, string | true>,
> {
  name: string;
  description?: string;
  validator?: A;
}

export const SingleArgumentSpec: z.ZodType<SingleArgumentSpec> = z.object({
  name: z.string(),
  description: z.optional(z.string()),
  validator: z.optional(z.any()),
});

export interface ArgumentSpec {
  name: string;
  description?: string;
  multiple?: boolean;
}

export const ArgumentSpec: z.ZodType<ArgumentSpec> = z.object({
  name: z.string(),
  description: z.optional(z.string()),
  multiple: z.optional(z.boolean()),
});

export interface OptionSpec {
  name: string;
  aliases: string[];
  description?: string;
  multiple?: boolean;
  argument?: SingleArgumentSpec;
}

export const OptionSpec: z.ZodType<OptionSpec> = z.object({
  name: z.string(),
  aliases: z.array(z.union([
    z.string().regex(/^--[\w-]+$/).startsWith("--"),
    z.string().regex(/^-\w$/).startsWith("-").length(2),
  ])).min(1),
  description: z.optional(z.string()),
  multiple: z.optional(z.boolean()),
  argument: z.optional(SingleArgumentSpec),
});

export interface CommandSpec {
  name: string;
  description?: string;
  options?: OptionSpec[];
  arguments?: ArgumentSpec[];
  subcommands?: CommandSpec[];
  handler?: Handler;
}
export const CommandSpec: z.ZodType<CommandSpec> = z.object({
  name: z.string(),
  description: z.optional(z.string()),
  options: z.optional(z.array(OptionSpec)),
  arguments: z.optional(z.array(ArgumentSpec)),
  subcommands: z.optional(z.array(z.lazy(() => CommandSpec))),
  handler: z.optional(Handler),
});

export interface CommandParsedSpec<
  A extends Record<string, unknown> = Record<string, unknown>,
  B extends unknown[] = unknown[],
> {
  parent?: CommandParsedSpec;
  spec: CommandSpec;
  commandPath: string[];
  optionsParsed: A;
  argumentsParsed: B;
}
export const CommandParsedSpec: z.ZodType<CommandParsedSpec> = z.object({
  parent: z.optional(z.lazy(() => CommandParsedSpec)),
  spec: CommandSpec,
  commandPath: z.array(z.string()),
  optionsParsed: z.record(z.any()),
  argumentsParsed: z.array(z.any()),
});
