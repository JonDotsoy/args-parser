import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertInstanceOf,
  assertMatch,
  assertNotStrictEquals,
  assertObjectMatch,
} from "asserts";
import { z } from "zod";
import { spy } from "mock";
import {
  bindArgs,
  buildHelpDialog,
  createSchemaValidation,
  parseArgs,
} from "./command-spec.ts";
import {
  CommandParsedSpec,
  CommandSpec,
  OptionSpec,
} from "./schemas/command-spec.ts";

Deno.test("command-spec should build help dialog", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
  };

  const helpMessage = buildHelpDialog(commandSpec, []);

  assertEquals(await helpMessage.next(), {
    done: false,
    value: "I am description",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Usage: cli" });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: true, value: undefined });
});

Deno.test("command-spec should build help dialog with arguments", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    arguments: [
      {
        name: "<abc>",
      },
    ],
  };

  const helpMessage = await buildHelpDialog(commandSpec, []);

  assertEquals(await helpMessage.next(), {
    done: false,
    value: "I am description",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "Usage: cli <abc>",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: true, value: undefined });
});

Deno.test("command-spec should build help dialog with arguments", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    arguments: [
      {
        name: "<abc>",
        description: "im an argument",
      },
    ],
  };

  const helpMessage = await buildHelpDialog(commandSpec, []);

  assertEquals(await helpMessage.next(), {
    done: false,
    value: "I am description",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "Usage: cli <abc>",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Arguments" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "  <abc>    im an argument",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: true, value: undefined });
});

Deno.test("command-spec should build help dialog with arguments and options", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    arguments: [
      {
        name: "<abc>",
        description: "im an argument",
      },
    ],
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
      },
    ],
  };

  const helpMessage = await buildHelpDialog(commandSpec, []);

  assertEquals(await helpMessage.next(), {
    done: false,
    value: "I am description",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "Usage: cli [options] <abc>",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Arguments" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "  <abc>       im an argument",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Options" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "  -a --abc    abc option",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: true, value: undefined });
});

Deno.test("command-spec should build help dialog with arguments, options and subcommands", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    arguments: [
      {
        name: "<abc>",
        description: "im an argument",
      },
    ],
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
      },
    ],
    subcommands: [
      {
        name: "ls",
      },
    ],
  };

  const helpMessage = await buildHelpDialog(commandSpec, []);

  assertEquals(await helpMessage.next(), {
    done: false,
    value: "I am description",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "Usage: cli [options] <abc>",
  });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "   or: cli [options] <command>",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Arguments" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "  <abc>       im an argument",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Options" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "  -a --abc    abc option",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: true, value: undefined });
});

Deno.test("command-spec should build help dialog with arguments, options and subcommands", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    arguments: [
      {
        name: "<abc>",
        description: "im an argument",
      },
    ],
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
  };

  const helpMessage = await buildHelpDialog(commandSpec, []);

  assertEquals(await helpMessage.next(), {
    done: false,
    value: "I am description",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "Usage: cli [options] <abc>",
  });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "   or: cli [options] <command>",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Arguments" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "  <abc>       im an argument",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Commands" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "  ls          ls command",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: false, value: "Options" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "  -a --abc    abc option",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: true, value: undefined });
});

Deno.test("command-spec should build help dialog to the subcommand", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    arguments: [
      {
        name: "<abc>",
        description: "im an argument",
      },
    ],
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
  };

  const helpMessage = await buildHelpDialog(commandSpec, ["abc", "ls"]);

  assertEquals(await helpMessage.next(), { done: false, value: "ls command" });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), {
    done: false,
    value: "Usage: cli ls",
  });
  assertEquals(await helpMessage.next(), { done: false, value: "" });
  assertEquals(await helpMessage.next(), { done: true, value: undefined });
});

Deno.test("command-spec should build help dialog to not found command", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
  };

  let error: unknown;
  try {
    // deno-lint-ignore no-empty
    for await (const _ of buildHelpDialog(commandSpec, ["ls", "no-found"])) {}
  } catch (ex) {
    error = ex;
  }

  assertExists(error);
  assertInstanceOf(error, Error);
  assertMatch(
    error.message,
    /cli ls no-found: Is not valid command. See cli ls --help/,
  );

  // assertEquals(await helpMessage.next(), { done: false, value: "cli ls no-found: Is not valid command. See cli --help" });
  // assertEquals(await helpMessage.next(), { done: true, value: undefined });
});

Deno.test("should parsing the arguments string to return the parsed command object with command path", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
  };

  const { commandParsedSpec: parsed } = await parseArgs(commandSpec, ["ls"]);

  assertExists(parsed);
  assertEquals(parsed.commandPath, ["cli", "ls"]);
  assertExists(parsed.parent);
  assertEquals(parsed.parent.commandPath, ["cli"]);
});

Deno.test("should parsing the arguments string with options", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
  };

  const { commandParsedSpec: parsed } = await parseArgs(commandSpec, [
    "--abc",
    "ls",
  ]);

  assertExists(parsed);
  assertExists(parsed.parent);
  assertEquals(parsed.parent.optionsParsed, { a: true, abc: true });
});

Deno.test("should parsing the arguments string at return an options with argument", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
        argument: {
          name: "<abc>",
        },
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
  };

  const { commandParsedSpec: parsed } = await parseArgs(commandSpec, [
    "--abc",
    "foo",
  ]);

  assertExists(parsed);
  assertNotStrictEquals(parsed.optionsParsed, { abc: "foo" });
});

Deno.test("should parsing the arguments string at return an options with argument (multiple)", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
        multiple: true,
        argument: {
          name: "<abc>",
        },
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
  };

  const { commandParsedSpec: parsed } = await parseArgs(commandSpec, [
    "--abc",
    "foo",
    "--abc",
    "baz",
  ]);

  assertExists(parsed);
  assertEquals(parsed.optionsParsed, {
    a: ["foo", "baz"],
    abc: ["foo", "baz"],
  });
});

Deno.test("should parse arguments string and get the arguments", async () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
        multiple: true,
        argument: {
          name: "<abc>",
        },
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
    arguments: [
      {
        name: `<path>`,
        description: `a path`,
      },
    ],
  };

  const { commandParsedSpec: parsed } = await parseArgs(commandSpec, [
    "--abc",
    "foo",
    "--abc",
    "baz",
    "me_path",
  ]);

  assertExists(parsed);
  assertEquals(parsed.argumentsParsed, ["me_path"]);
});

Deno.test("should parse argument string complex", () => {
  const commandSpec: CommandSpec = {
    name: "cli",
    description: "I am description",
    options: [
      {
        names: ["-a", "--abc"],
        description: "abc option",
        multiple: true,
        argument: {
          name: "<abc>",
        },
      },
    ],
    subcommands: [
      {
        name: "ls",
        description: "ls command",
      },
    ],
    arguments: [
      {
        name: `<path>`,
        description: `a path`,
      },
    ],
  };

  parseArgs(commandSpec, ["-a", "foo", "./f"]);
});

Deno.test("invoke handler functions", async (t) => {
  const handlerSpy = spy();
  const commandSpec: CommandSpec = {
    name: "cli",
    options: [
      {
        names: ["-o", "--output"],
        argument: {
          name: "format",
        },
      },
    ],
    subcommands: [
      {
        name: "user",
        subcommands: [
          {
            name: "edit",
            handler: handlerSpy,
            arguments: [
              {
                name: "user_id",
              },
            ],
          },
        ],
      },
    ],
  };
  await t.step(
    "should invoke handler if the command arguments is match",
    async () => {
      await bindArgs(commandSpec, [
        "--output",
        "yaml",
        "user",
        "edit",
        "user1",
      ]);

      assertEquals(handlerSpy.calls.length, 1);
      const [firstCall] = handlerSpy.calls;
      const [args, options, parsed] = firstCall.args;

      assertArrayIncludes(args, ["user1"]);
      assertObjectMatch(options, {
        "output": "yaml",
      });
      assertObjectMatch(parsed, {
        commandPath: ["cli", "user", "edit"],
      });
    },
  );
});

Deno.test("should make a schema validator from a command spec", () => {
  const handlerSpy = spy();
  const userEditCommandSpec: CommandSpec = {
    name: "edit",
    handler: handlerSpy,
    arguments: [
      {
        name: "user_id",
      },
    ],
  };
  const userCommandSpec: CommandSpec = {
    name: "user",
    subcommands: [
      userEditCommandSpec,
    ],
  };
  const commandSpec: CommandSpec = {
    name: "cli",
    options: [
      {
        names: ["-o", "--output"],
        argument: {
          name: "format",
        },
      },
    ],
    subcommands: [
      userCommandSpec,
    ],
  };
  const commandParsedSpec: CommandParsedSpec = {
    parent: {
      parent: {
        spec: commandSpec,
        commandPath: ["cli"],
        argumentsParsed: [],
        optionsParsed: { output: "yaml" },
      },
      spec: userCommandSpec,
      commandPath: ["cli", "user"],
      argumentsParsed: [],
      optionsParsed: { output: "yaml" },
    },
    spec: userEditCommandSpec,
    commandPath: ["cli", "user", "edit"],
    argumentsParsed: [],
    optionsParsed: { output: "yaml" },
  };

  const schemas = createSchemaValidation(commandParsedSpec);

  assertExists(schemas);
  assertInstanceOf(schemas.optionSchema, z.ZodObject);
  assertInstanceOf(schemas.argumentsSchema, z.ZodTuple);
  // console.log(schemas.optionSchema._def);
  assertObjectMatch(schemas.optionSchema._def.shape(), {
    o: {
      _def: {
        typeName: "ZodString",
      },
    },
    output: {
      _def: {
        typeName: "ZodString",
      },
    },
  });
  assertObjectMatch(schemas.argumentsSchema, {
    _def: {
      items: [{
        _def: {
          typeName: "ZodString",
        },
      }],
      typeName: "ZodTuple",
    },
  });
});

Deno.test("should make a argument parser", async () => {
  const handlerSpy = spy();
  const commandSpec: CommandSpec = {
    name: "cli",
    options: [
      {
        names: ["-o", "--output"],
        argument: {
          name: "format",
        },
      },
    ],
    subcommands: [
      {
        name: "user",
        subcommands: [
          {
            name: "edit",
            handler: handlerSpy,
            arguments: [
              {
                name: "user_id",
              },
            ],
          },
        ],
      },
    ],
  };

  let error: unknown;
  try {
    const { validate } = await parseArgs(commandSpec, [
      "--output",
      "yaml",
      "user",
      "edit",
    ]);
    await validate();
  } catch (ex) {
    error = ex;
  }

  assertExists(error);
  assertInstanceOf(error, Error);
  assertMatch(error.message, /Missing user_id argument/);
  assertExists(error.cause);
  assertInstanceOf(error.cause, z.ZodError);
});
