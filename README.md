# 🔺 prismagen

Define your [Prisma](https://www.prisma.io/) schema across multiple files and in a directory structure of your choice.

Compile it all into one `schema.prisma`.

Example directory structure:
```
├── prisma
│   ├── user
│   │   ├── account.schema
│   │   ├── session.schema
│   ├── organization
│   │   ├── group.schema
│   │   ├── event.schema
└── base.schema (datasource and generators)
```

Resulting `prisma.schema`:
```
datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

generator js {
    provider = "prisma-client-js"
}

model Account {
    ...
}

model Session {
    ...
}

model Group {
    ...
}

model Event {
    ...
}

...
```

## Usage

```
prismagen <path to files> -b <base_filename.prisma?> -o <output_filename.prisma?>
```

Example: `prisma .` = `prisma . -b base.prisma -o schema.prisma`

1. Define your `datasource` and `generator`s in a `base.prisma` file.
2. Define enums, models, etc. in the current directory and in subdirectories.
3. Run `prismagen .` to generate a `schema.prisma` in the current directory.
