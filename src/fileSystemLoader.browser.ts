import { FluentBundle } from "@fluent/bundle";
import type { FluentBox } from ".";

export default function loader(self: FluentBox, locale: Intl.Locale, localeAsStr: string, bundle: FluentBundle): Promise<[string, FluentBundle]> {
    console.error(`File system Fluent Translation Lists not supported in browser`);
    return Promise.reject(undefined);
};