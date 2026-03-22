# My [zk](https://github.com/zk-org/zk/) external tools.

## Why?

Currently, there are no ways to filter by metadata (without full-text search
[^1]). I want to manage tasks with zk, so I decided to make this.

And then, I want to manipulate daily notes under my operation, manage task, or
more.

## Why GPv3?

Because zk has been released under
[GPLv3](https://github.com/zk-org/zk/blob/10d93d5d6419941420e7775d409e530a7de59cbc/LICENSE)[^2].

## How to use?

Run, `my-zk-ext init` in zk notebooks. This will add templates, groups and
aliases. Aliases are `zk project` and `zk task`. Read ./docs/task-workflow.md to
manage task with this.

## Development

### Setup

```
git config core.hooksPath .git_hooks
```

[^1]: https://github.com/zk-org/zk/discussions/252

[^2]: I know I don't need to.
