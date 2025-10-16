# IntlBlaze

<p align="center">
  <a href="./docs/globals.md"><img src="https://img.shields.io/badge/TypeScript%20API%20Documentation-gray"></a>
</p>

Rapidly support [Project Fluent](https://projectfluent.org) translation in your web application. Both client-side and server-side applications are supported.

That is an updated version of [com.hydroper.ftl](https://www.npmjs.com/package/com.hydroper.ftl).

## Getting Started

Install dependency:

```sh
npm install @hydroperx/intlblaze
```

Example TypeScript:

```ts
import { IntlBlaze } from "@hydroperx/intlblaze";

class Main {
    intlblaze: IntlBlaze;

    constructor() {
        this.intlblaze = new IntlBlaze({
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

    async initialize() {
        if (!(await this.intlblaze.load())) {
            // failed to load
            return;
        }

        console.log(this.intlblaze.get("hello", { to: "Diantha" }));
    }
}

new Main();
```

Example FTL file at `res/lang/en/_.ftl`:

```
hello = Hello, { $to }!
```

## Server Usage

Usually, for server applications, set the `clean` option to `false` and clone the `IntlBlaze` object when necessary by invoking `intlblaze.clone();` to change the current locale.

The `intlblaze.clone();` method clones the `IntlBlaze` object, but still re-uses resources from the original object, avoiding resource duplication.