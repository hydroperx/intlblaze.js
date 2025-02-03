# Fluent Project rapid integration

<p align="center">
  <a href="https://jsr.io/@hydroper/fluent"><img src="https://img.shields.io/jsr/v/@hydroper/fluent"></a>
  <a href="https://jsr.io/@hydroper/fluent/doc"><img src="https://img.shields.io/badge/API%20Documentation-gray"></a>
</p>

Rapidly support Fluent Project's translation in your web application. Both client-side and server-side applications are supported.

That is an updated version of [com.hydroper.ftl](https://www.npmjs.com/package/com.hydroper.ftl).

## Getting Started

Install dependency:

```sh
npx jsr add @hydroper/fluent
```

Example TypeScript:

```ts
import { FluentBox } from "@hydroper/fluent";

class Main
{
    fluentBox: FluentBox;

    constructor()
    {
        this.fluentBox = new FluentBox({
            supportedLocales: ["en"],
            fallbacks: {
                // "pt-BR": ["en"],
            },
            defaultLocale: "en",

            assetSource: "res/lang",
            assetFiles: [
                "_", // res/lang/LANG/_.ftl
            ],

            cleanUnusedAssets: true,

            // specify either 'http' or 'fileSystem' as load method
            loadMethod: "fileSystem",
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

Usually, for server applications, set the `cleanUnusedAssets` option to `false` and clone the `FluentBox` object when necessary by invoking `fluentBox.clone();` to change the current locale.

The `fluentBox.clone();` method clones the `FluentBox` object, but still re-uses resources from the original object, avoiding resource duplication.