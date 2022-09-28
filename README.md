## Argument Parse

An argument parser with a good definition.

- Describe the argument spec
- Help dialog generator
- Options and Argument parser

### Bind a command spec

## Sample Args Integration

```yaml
# /cli/args.yaml
name: cli
description: the super cli
subcommands:
    - name: user
      description: edit users, create users, etc...
      subcommands:
        - name: edit
          arguments:
          - name: user_id
            handler:
                $ref: userEdit.ts
```

## Contribution

Please install next dependencies:

- husky (https://typicode.github.io/husky/#/?id=manual)
- commitlint (https://commitlint.js.org/#/?id=install)

