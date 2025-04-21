# Fluent Project rapid integration

Rapidly support Fluent Project's translation in your web application. Both client-side and server-side applications are supported.

That is an updated version of [com.hydroper.ftl](https://www.npmjs.com/package/com.hydroper.ftl).

## Getting Started

Install dependency:

```sh
npm install @hydroperx/fluent
```

Example TypeScript:

```ts
import { FluentBox } from "@hydroperx/fluent";

class Main
{
    fluentBox: FluentBox;

    constructor()
    {
        this.fluentBox = new FluentBox({
            locales: ["en"],
            fallbacks: {
                // "pt-BR": ["en"],
            },
            defaultLocale: "en",

            source: "res/lang",
            files: [
                "_", // res/lang/LANG/_.ftl
            ],

            clean: true,

            // specify either 'http' or 'fileSystem' as load method
            method: "fileSystem",
        });
        this.initialize();
    }

    async initialize()
    {
        if (!(await this.fluentBox.load()))
        {
            // failed to load
            return;
        }

        console.log(this.fluentBox.getMessage("hello", { to: "Diantha" }));
    }
}

new Main();
```

Example FTL file at `res/lang/en/_.ftl`:

```
hello = Hello, { $to }!
```

## Server Usage

Usually, for server applications, set the `clean` option to `false` and clone the `FluentBox` object when necessary by invoking `fluentBox.clone();` to change the current locale.

The `fluentBox.clone();` method clones the `FluentBox` object, but still re-uses resources from the original object, avoiding resource duplication.