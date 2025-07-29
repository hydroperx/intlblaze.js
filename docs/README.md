**@hydroperx/tradur**

***

# Tradur

<p align="center">
  <a href="_media/globals.md"><img src="https://img.shields.io/badge/TypeScript%20API%20Documentation-gray"></a>
</p>

Rapidly support [Project Fluent](https://projectfluent.org) translation in your web application. Both client-side and server-side applications are supported.

That is an updated version of [com.hydroper.ftl](https://www.npmjs.com/package/com.hydroper.ftl).

## Getting Started

Install dependency:

```sh
npm install @hydroperx/tradur
```

Example TypeScript:

```ts
import { Tradur } from "@hydroperx/tradur";

class Main {
    tradur: Tradur;

    constructor() {
        this.tradur = new Tradur({
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
        if (!(await this.tradur.load())) {
            // failed to load
            return;
        }

        console.log(this.tradur.get("hello", { to: "Diantha" }));
    }
}

new Main();
```

Example FTL file at `res/lang/en/_.ftl`:

```
hello = Hello, { $to }!
```

## Server Usage

Usually, for server applications, set the `clean` option to `false` and clone the `Tradur` object when necessary by invoking `tradur.clone();` to change the current locale.

The `tradur.clone();` method clones the `Tradur` object, but still re-uses resources from the original object, avoiding resource duplication.
