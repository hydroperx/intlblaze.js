import { FluentBundle, FluentVariable } from '@fluent/bundle';

/**
 * Interface for working with Fluent Translation Lists.
 */
export declare class FTL {
    constructor(options: FTLOptions);

    /**
     * Adds a bundle initializer. This allows defining custom functions and more.
     */
    addBundleInitializer(fn: FTLBundleInitializer): void;

    /**
     * Returns a set of supported locales, reflecting
     * the ones that were specified when constructing the `FTL` object.
     */
    get supportedLocales(): Set<Intl.Locale>;

    /**
     * Returns `true` if the locale is one of the supported locales
     * that were specified when constructing the `FTL` object,
     * otherwise `false`.
     */
    supportsLocale(argument: Intl.Locale): boolean;

    /**
     * Returns the currently loaded locale or null if none.
     */
    get currentLocale(): null | Intl.Locale;

    /**
     * Returns the currently loaded locale followed by its fallbacks or empty if no locale is loaded.
     */
    get localeAndFallbacks(): Intl.Locale[];

    /**
     * Returns the currently loaded fallbacks.
     */
    get fallbacks(): Intl.Locale[];

    /**
     * Attempts to load a locale and its fallbacks.
     * If the locale argument is specified, it is loaded.
     * Otherwise, if there is a default locale, it is loaded, and if not,
     * the method throws an error.
     * 
     * If any resource fails to load, the returned `Promise`
     * resolves to `false`, otherwise `true`.
     */
    load(newLocale?: null | Intl.Locale): Promise<boolean>;

    /**
     * Retrieves message and format it. Returns `null` if undefined.
     */
    getMessage(id: string, args?: null | Record<string, FluentVariable>, errors?: null | Error[]): string;

    /**
     * Determines if message is defined.
     */
    hasMessage(id: string): boolean;

    /**
     * Clones the FTL object, but returning an object that is
     * in sync with the original FTL object.
     */
    clone(): FTL;
}

export type FTLOptions = {
    supportedLocales: string[];
    fallbacks?: Record<string, string[]>;
    defaultLocale: string;
    assetSource: string;
    assetFiles: string[];
    cleanUnusedAssets: boolean;
    loadMethod: 'http' | 'fileSystem';
};

export type FTLBundleInitializer = (locale: Intl.Locale, bundle: FluentBundle) => void;