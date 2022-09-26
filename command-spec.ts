
interface Handler<A = string[], O = Record<string, string | string[]>> {
    (args: A, options: O): Promise<void> | void
}

export interface SingleArgumentSpec {
    name: `<${string}>`
    description?: string
}

export interface ArgumentSpec {
    name: `<${string}>` | `[${string}]` | `[${string}...]`
    description?: string
    multiple?: boolean
}

export interface OptionSpec {
    names: string[]
    description?: string
    multiple?: boolean
    argument?: SingleArgumentSpec
}

export interface CommandSpec {
    name: string
    description?: string
    options?: OptionSpec[]
    arguments?: ArgumentSpec[]
    subcommands?: CommandSpec[]
    handler?: Handler
}

export interface CommandParsedSpec {
    parent?: CommandParsedSpec,
    spec: CommandSpec,
    commandPath: string[]
    optionsParsed: Record<string, any>
    argumentsParsed: any[]
}

export const buildSelectHelpDialog = async function* (spec: CommandSpec | undefined, [binCli, ...commandsPath]: string[], _args: string[]): AsyncGenerator<string> {
    if (!spec) {
        yield `${[binCli, ...commandsPath].join(' ')}: Is not valid command. See ${binCli} --help`
        return
    }

    if (spec.description) {
        yield spec.description
        yield ""
    }

    const makeUseUsage = (used = false) => () => (used ? `or:` : (used = true, `Usage:`)).padStart(6, ' ');
    const useUsage = makeUseUsage();

    if (!spec.arguments?.length && !spec.subcommands?.length) {
        yield `${useUsage()} ${[binCli, ...commandsPath].join(" ")}${spec.options?.length ? ` [options]` : ''}`
    }
    if (spec.arguments?.length) {
        yield `${useUsage()} ${[binCli, ...commandsPath].join(" ")}${spec.options?.length ? ` [options]` : ''}${spec.arguments?.length ? ` ${spec.arguments.map(o => o.name).join(' ')}` : ''}`
    }
    if (spec.subcommands?.length) {
        yield `${useUsage()} ${[binCli, ...commandsPath].join(" ")}${spec.options?.length ? ` [options]` : ''}${spec.subcommands?.length ? ` <command>` : ''}`
    }
    yield ""

    const n = (names: string[]) => names.join(" ")

    const argumentPadLen = spec.arguments?.reduce((a, { name: { length } }) => length > a ? length : a, 0) ?? 0
    const optionsPadLen = spec.options?.reduce((a, { names }) => { const l = n(names).length; return l > a ? l : a }, 0) ?? 0
    const subcommandPadLen = spec.subcommands?.reduce((a, { name: { length } }) => length > a ? length : a, 0) ?? 0
    const padLen = [argumentPadLen, optionsPadLen, subcommandPadLen].reduce((a, b) => b > a ? b : a, 0);

    // console.log({ argumentPadLen, optionsPadLen, subcommandPadLen, padLen })

    if (spec.arguments?.filter(a => a.description).length) {
        yield "Arguments"
        for (const arg of spec.arguments) {
            yield `  ${arg.name.padEnd(padLen, ' ')}    ${arg.description ?? ''}`
        }
        yield ""
    }

    if (spec.subcommands?.filter(a => a.description).length) {
        yield "Commands"
        for (const command of spec.subcommands) {
            yield `  ${command.name.padEnd(padLen, ' ')}    ${command.description ?? ''}`
        }
        yield ""
    }

    if (spec.options?.filter(o => o.description).length) {
        yield "Options"
        for (const option of spec.options) {
            yield `  ${n(option.names).padEnd(padLen, ' ')}    ${option.description ?? ''}`
        }
        yield ""
    }
};

export const buildHelpDialog = async function* (spec: CommandSpec, args: string[]): AsyncGenerator<string> {
    yield* buildSelectHelpDialog(spec, [spec.name], args)
}

export const selectCommandSpec = (spec: CommandSpec | undefined, commandsPath: string[], args: string[]): [spec: CommandSpec | undefined, commandsPath: string[], args: string[]] => {
    let specMatch: CommandSpec | undefined = spec;
    let commandsPathMatch: string[] = [...commandsPath];

    for (const arg of args) {
        if (arg.startsWith('-')) continue;
        if (!specMatch) break;
        commandsPathMatch.push(arg);
        specMatch = specMatch?.subcommands?.find(e => e.name === arg);
    }

    return [specMatch, commandsPathMatch, args];
}

export const parseArgs = (spec: CommandSpec, args: string[]): CommandParsedSpec => {
    let commandParsedSpec: CommandParsedSpec = {
        argumentsParsed: [],
        commandPath: [spec.name],
        optionsParsed: {},
        spec,
    }

    const argsIterator = args[Symbol.iterator]()
    let done: boolean | undefined
    let arg: string
    while ({ done, value: arg } = argsIterator.next(), !done) {
        if (arg.startsWith('-')) {
            const optionSpec = spec.options?.find(optionSpec => optionSpec.names.includes(arg))
            if (!optionSpec) throw new Error("Not implemented yet")
            const isOptionBoolean = !optionSpec.argument
            const val = isOptionBoolean ? true : argsIterator.next().value;
            for (const name of optionSpec.names) {
                const nameTrim = name.substring(name.startsWith('--') ? 2 : 1)
                commandParsedSpec.optionsParsed[nameTrim] = optionSpec.multiple
                    ? [...(commandParsedSpec.optionsParsed[nameTrim] ?? []), val]
                    : val;
            }
        } else {
            let subcommandFound = spec.subcommands?.find(subcommand => subcommand.name === arg)
            if (!subcommandFound) {
                throw new Error("Not implemented yet")
            }
            let parent = commandParsedSpec
            commandParsedSpec = {
                parent,
                spec: subcommandFound,
                argumentsParsed: [],
                commandPath: [...parent.commandPath, subcommandFound.name],
                optionsParsed: [],
            }
            continue
        }
    }

    // console.log(Deno.inspect(commandParsedSpec, { depth: Infinity, colors: true }))
    return commandParsedSpec;
}

export const buildCommandSpec = async (_spec: CommandSpec, _args: string[]): Promise<void> => {
    throw new Error("No implemented yet")
};
