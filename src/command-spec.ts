import { z } from "zod";
import {
  ArgumentSpec,
  CommandParsedSpec,
  CommandSpec,
} from "./schemas/command-spec.ts";

export class CommandNotFoundError extends Error {
  constructor(commandPath: string[], notFoundArg: string) {
    super(
      `${commandPath.join(" ")} ${notFoundArg}: Is not valid command. See ${
        commandPath.join(" ")
      } --help`,
    );
  }
}

export class MissingArgumentError extends Error {
  constructor(parseError: z.ZodError, commandParsedSpec: CommandParsedSpec) {
    super("unknow error");
    this.cause = parseError;
    // `${commandPath.join(" ")} ${notFoundArg}: Is not valid command. See ${commandPath.join(" ")
    // } --help`,
    // );
    const issue = parseError.issues.at(0);
    if (issue?.code === "too_small") {
      this.message = `Missing ${
        commandParsedSpec.spec.arguments?.map((m) => m.name).join(", ") ?? ""
      } argument`;
    }
  }
}

export const buildSelectHelpDialog = async function* (
  spec: CommandSpec | undefined,
  [binCli, ...commandsPath]: string[],
  _args: string[],
): AsyncGenerator<string> {
  if (!spec) {
    yield `${
      [binCli, ...commandsPath].join(" ")
    }: Is not valid command. See ${binCli} --help`;
    return;
  }

  if (spec.description) {
    yield spec.description;
    yield "";
  }

  const makeUseUsage = (used = false) => () =>
    (used ? `or:` : (used = true, `Usage:`)).padStart(6, " ");
  const useUsage = makeUseUsage();

  if (!spec.arguments?.length && !spec.subcommands?.length) {
    yield `${useUsage()} ${[binCli, ...commandsPath].join(" ")}${
      spec.options?.length ? ` [options]` : ""
    }`;
  }
  if (spec.arguments?.length) {
    yield `${useUsage()} ${[binCli, ...commandsPath].join(" ")}${
      spec.options?.length ? ` [options]` : ""
    }${
      spec.arguments?.length
        ? ` ${spec.arguments.map((o) => o.name).join(" ")}`
        : ""
    }`;
  }
  if (spec.subcommands?.length) {
    yield `${useUsage()} ${[binCli, ...commandsPath].join(" ")}${
      spec.options?.length ? ` [options]` : ""
    }${spec.subcommands?.length ? ` <command>` : ""}`;
  }
  yield "";

  const n = (names: string[]) => names.join(" ");

  const argumentPadLen = spec.arguments?.reduce(
    (a, { name: { length } }) => length > a ? length : a,
    0,
  ) ?? 0;
  const optionsPadLen = spec.options?.reduce((a, { aliases }) => {
    const l = n(aliases).length;
    return l > a ? l : a;
  }, 0) ?? 0;
  const subcommandPadLen = spec.subcommands?.reduce(
    (a, { name: { length } }) => length > a ? length : a,
    0,
  ) ?? 0;
  const padLen = [argumentPadLen, optionsPadLen, subcommandPadLen].reduce(
    (a, b) => b > a ? b : a,
    0,
  );

  // console.log({ argumentPadLen, optionsPadLen, subcommandPadLen, padLen })

  if (spec.arguments?.filter((a) => a.description).length) {
    yield "Arguments";
    for (const arg of spec.arguments) {
      yield `  ${arg.name.padEnd(padLen, " ")}    ${arg.description ?? ""}`;
    }
    yield "";
  }

  if (spec.subcommands?.filter((a) => a.description).length) {
    yield "Commands";
    for (const command of spec.subcommands) {
      yield `  ${command.name.padEnd(padLen, " ")}    ${
        command.description ?? ""
      }`;
    }
    yield "";
  }

  if (spec.options?.filter((o) => o.description).length) {
    yield "Options";
    for (const option of spec.options) {
      yield `  ${n(option.aliases).padEnd(padLen, " ")}    ${
        option.description ?? ""
      }`;
    }
    yield "";
  }
};

export const buildHelpDialog = async function* (
  spec: CommandSpec,
  args: string[],
): AsyncGenerator<string> {
  const { commandParsedSpec: a } = parseArgs(spec, args);
  yield* buildSelectHelpDialog(a.spec, a.commandPath, args);
};

export const parseArgs = (
  spec: CommandSpec,
  args: string[],
): { commandParsedSpec: CommandParsedSpec; validate: () => void } => {
  let commandParsedSpec: CommandParsedSpec = {
    argumentsParsed: [],
    commandPath: [spec.name],
    optionsParsed: {},
    spec,
  };

  const argsIterator = args[Symbol.iterator]();
  let done: boolean | undefined;
  let arg: string;
  while ({ done, value: arg } = argsIterator.next(), !done) {
    const optionFlow = () => {
      const optionSpec = spec.options?.find((optionSpec) =>
        optionSpec.aliases.includes(arg)
      );
      if (!optionSpec) throw new Error("Not implemented yet");
      const isOptionBoolean = !optionSpec.argument;
      const val = isOptionBoolean ? true : argsIterator.next().value;
      for (const name of optionSpec.aliases) {
        const nameTrim = name.substring(name.startsWith("--") ? 2 : 1);
        const a = commandParsedSpec.optionsParsed[nameTrim];
        commandParsedSpec.optionsParsed[nameTrim] = optionSpec.multiple
          ? [...(Array.isArray(a) ? a : []), val]
          : val;
      }
    };
    const subcommandFlow = (commandSpec: CommandSpec) => {
      const parent = commandParsedSpec;
      commandParsedSpec = {
        parent,
        spec: commandSpec,
        argumentsParsed: [],
        commandPath: [...parent.commandPath, commandSpec.name],
        optionsParsed: { ...parent.optionsParsed },
      };
    };
    const argumentFlow = (_argumentSpec: ArgumentSpec) => {
      commandParsedSpec.argumentsParsed.push(arg);
    };

    const optionFlowDetected = arg.startsWith("-");
    const subcommandDetected = commandParsedSpec.spec.subcommands?.find(
      (subcommand) => subcommand.name === arg,
    );
    const argumentFlowDetected = commandParsedSpec.spec.arguments
      ?.[commandParsedSpec.argumentsParsed.length];

    if (optionFlowDetected) {
      optionFlow();
      continue;
    }
    if (subcommandDetected) {
      subcommandFlow(subcommandDetected);
      continue;
    }
    if (argumentFlowDetected) {
      argumentFlow(argumentFlowDetected);
      continue;
    }
    // console.log(Deno.inspect(commandParsedSpec, { depth: Infinity, colors: true }))
    throw new CommandNotFoundError(commandParsedSpec.commandPath, arg);
  }

  const validate = async () => {
    const { argumentsSchema } = createSchemaValidation(commandParsedSpec);

    const argumentsParsed = await argumentsSchema.safeParseAsync(
      commandParsedSpec.argumentsParsed,
    );

    if (!argumentsParsed.success) {
      throw new MissingArgumentError(argumentsParsed.error, commandParsedSpec);
    }

    return {
      argumentsParsed,
    };
  };

  // console.log(Deno.inspect(commandParsedSpec, { depth: Infinity, colors: true }))
  return { commandParsedSpec, validate };
};

export const bindArgs = async (spec: CommandSpec, args: string[]) => {
  const { commandParsedSpec: parsed, validate } = await parseArgs(spec, args);

  validate();

  await parsed.spec.handler?.(
    parsed.argumentsParsed,
    parsed.optionsParsed,
    parsed,
  );
};

export const createSchemaValidation = (
  commandParsedSpec: CommandParsedSpec,
): {
  optionSchema: z.Schema;
  argumentsSchema: z.Schema;
} => {
  const optionObjectSchema: Record<
    string,
    z.Schema<unknown, z.ZodTypeDef, string | true>
  > = {};
  const argumentTupleSchema: z.Schema[] = [];

  commandParsedSpec.spec.arguments?.forEach((_argumentSpec) => {
    argumentTupleSchema.push(z.string());
  });

  for (
    let selectCommandParsedSpec: CommandParsedSpec | undefined =
      commandParsedSpec;
    selectCommandParsedSpec;
    selectCommandParsedSpec = selectCommandParsedSpec.parent
  ) {
    selectCommandParsedSpec.spec.options?.forEach((optionSpec) => {
      const schema = optionSpec.argument ? z.string() : z.literal(true);
      optionObjectSchema[optionSpec.name] = schema;
    });
  }

  return {
    optionSchema: z.object(optionObjectSchema),
    argumentsSchema: z.tuple(argumentTupleSchema as []),
  };
};
