import fileSystemLoader from "./fileSystemLoader.nodejs";
import httpLoader from "./httpLoader";
import { FluentBundle, FluentVariable } from "@fluent/bundle";

/**
 * Manages Fluent Project translation lists (FTL).
 */
export class FluentBox {
    private _currentLocale: Intl.Locale | null = null;

    // Map<string, string>
    // Maps a locale identifier String to its equivalent path component.
    // The string mapped depends in how the
    // FluentBox object was constructed. If the `supportedLocales` option
    // contains "en-us", then `_localeToPathComponents.get(new Intl.Locale("en-US").toString())` returns "en-us".
    // When FTLs are loaded, this component is appended to the URL or file path;
    // for example, `"res/lang/en-us"`.
    /** @hidden */
    _localeToPathComponents = new Map;

    private _supportedLocales: Set<string> = new Set;
    private _defaultLocale: Intl.Locale | null = null;
    private _fallbacks: Map<string, string[]> = new Map;
    /** @hidden */
    _assets: Map<string, FluentBundle> = new Map;
    /** @hidden */
    _assetsSource: string = '';
    /** @hidden */
    _assetsFiles: string[] = [];
    private _bundleInitializers: BundleInitializer[] = [];
    private _cleanUnusedAssets: boolean = true;
    private _loadMethod: "http" | "fileSystem" = "http";

    private static _parseLocaleOrThrow(s: string | Intl.Locale) {
        try {
            return new Intl.Locale(s);
        } catch (e) {
            throw new Error(`${s} is a malformed locale`);
        }
    }

    /** @hidden */
    static _PRIVATE_CTOR: any = {};

    constructor(options: FluentBoxOptions) {
        if (options === FluentBox._PRIVATE_CTOR) {
            return;
        }
        if (typeof options !== 'object') {
            throw new Error('Invalid options argument');
        }
        if (!(options.supportedLocales instanceof Array)) {
            throw new Error('options.supportedLocales must be an Array');
        }
        for (let unparsedLocale of options.supportedLocales) {
            let parsedLocale = FluentBox._parseLocaleOrThrow(unparsedLocale);
            this._localeToPathComponents.set(parsedLocale.toString(), unparsedLocale);
            this._supportedLocales.add(parsedLocale.toString());
        }
        let fallbacks = options.fallbacks || {};
        for (let fallbackUnparsedLocale in fallbacks) {
            let fallbackParsedLocale = FluentBox._parseLocaleOrThrow(fallbackUnparsedLocale);
            let fallbackArray = fallbacks[fallbackUnparsedLocale];
            if (!fallbackArray) {
                throw new Error('options.fallbacks must map Locales to Arrays');
            }
            this._fallbacks.set(fallbackParsedLocale.toString(), fallbackArray.map(a => {
                if (typeof a !== 'string') {
                    throw new Error('options.fallbacks object is malformed');
                }
                return FluentBox._parseLocaleOrThrow(a).toString();
            }));
        }
        if (typeof options.defaultLocale !== 'string') {
            throw new Error('options.defaultLocale must be a String');
        }
        this._defaultLocale = FluentBox._parseLocaleOrThrow(options.defaultLocale);
        if (typeof options.assetSource !== 'string') {
            throw new Error('options.assetSource must be a String');
        }
        this._assetsSource = String(options.assetSource);
        if (!(options.assetFiles instanceof Array)) {
            throw new Error('options.assetFiles must be an Array');
        }
        this._assetsFiles = [];
        for (let fileName of options.assetFiles) {
            this._assetsFiles.push(fileName);
        }
        if (typeof options.cleanUnusedAssets !== 'boolean') {
            throw new Error('options.cleanUnusedAssets must be a Boolean');
        }
        this._cleanUnusedAssets = !!options.cleanUnusedAssets;
        if (['http', 'fileSystem'].indexOf(options.loadMethod) === -1)
        {
            throw new Error('options.loadMethod must be one of ["http", "fileSystem"]');
        }
        this._loadMethod = options.loadMethod;
    } // FluentBox constructor

    /**
     * Adds a bundle initializer. This allows defining custom functions and more.
     */
    addBundleInitializer(fn: BundleInitializer) {
        this._bundleInitializers.push(fn);
    }

    /**
     * Returns a set of supported locales, reflecting
     * the ones that were specified when constructing the `FluentBox` object.
     */
    get supportedLocales(): Set<Intl.Locale> {
        let r: Set<Intl.Locale> = new Set;
        for (let v of this._supportedLocales) {
            r.add(new Intl.Locale(v));
        }
        return r;
    }

    /**
     * Returns `true` if the locale is one of the supported locales
     * that were specified when constructing the `FluentBox` object,
     * otherwise `false`.
     */
    supportsLocale(argument: Intl.Locale | string) {
        return this._supportedLocales.has(argument.toString());
    }

    /**
     * Returns the currently loaded locale or null if none.
     */
    get currentLocale(): Intl.Locale | null {
        return this._currentLocale;
    }

    /**
     * Returns the currently loaded locale followed by its fallbacks or empty if no locale is loaded.
     */
    get localeAndFallbacks(): Intl.Locale[] {
        if (this._currentLocale) {
            let r: Intl.Locale[] = [this._currentLocale];
            this._enumerateFallbacks(this._currentLocale.toString(), r);
            return r;
        }
        return [];
    }

    /**
     * Returns the currently loaded fallbacks.
     */
    get fallbacks(): Intl.Locale[] {
        if (this._currentLocale) {
            let r: Intl.Locale[] = [];
            this._enumerateFallbacks(this._currentLocale.toString(), r);
            return r;
        }
        return [];
    }

    /**
     * Attempts to load a locale and its fallbacks.
     * If the locale argument is specified, it is loaded.
     * Otherwise, if there is a default locale, it is loaded, and if not,
     * the method throws an error.
     * 
     * If any resource fails to load, the returned `Promise`
     * resolves to `false`, otherwise `true`.
     */
    load(newLocale: Intl.Locale | null = null): Promise<boolean> {
        newLocale ||= this._defaultLocale;
        if (!(newLocale instanceof Intl.Locale)) {
            throw new Error(`Locale argument must be an Intl.Locale object`);
        }
        if (!this.supportsLocale(newLocale)) {
            throw new Error(`Unsupported locale: ${newLocale.toString()}`);
        }
        let self = this;
        return new Promise((resolve, reject) => {
            let toLoad: Set<Intl.Locale> = new Set([newLocale]);
            self._enumerateFallbacksToSet(newLocale.toString(), toLoad);

            let newAssets = new Map;
            Promise
                .all(Array.from(toLoad).map(a => self._loadSingleLocale(a)))
                .then(res => {
                    // res : [string, FluentBundle][]
                    if (self._cleanUnusedAssets) {
                        self._assets.clear();
                    }

                    for (let pair of res) {
                        self._assets.set(pair[0], pair[1]);
                    }
                    self._currentLocale = newLocale;

                    for (let bundleInit of self._bundleInitializers) {
                        bundleInit(newLocale, self._assets.get(newLocale.toString())!);
                    }

                    resolve(true);
                })
                .catch(_ => {
                    resolve(false);
                });
        });
    } // load

    /** @hidden  */
    get _assetFilesAsUntyped() {
        let r = [];
        for (let v of this._assetsFiles) {
            r.push(v);
        }
        return r;
    }

    // should resolve to [string, FluentBundle] (the first String is locale.toString())
    private _loadSingleLocale(locale: Intl.Locale): Promise<[string, FluentBundle]> {
        let self = this;
        let localeAsStr = locale.toString();
        let bundle = new FluentBundle(localeAsStr);

        if (this._loadMethod == 'fileSystem') {
            return fileSystemLoader(self, locale, localeAsStr, bundle);
        } else {
            return httpLoader(self, locale, localeAsStr, bundle);
        }
    }

    private _enumerateFallbacks(locale: string, output: Intl.Locale[]) {
        let list = this._fallbacks.get(locale);
        if (!list) {
            return;
        }
        for (let item of list) {
            output.push(new Intl.Locale(item));
            this._enumerateFallbacks(item, output);
        }
    }

    private _enumerateFallbacksToSet(locale: string, output: Set<Intl.Locale>) {
        let list = this._fallbacks.get(locale);
        if (!list) {
            return;
        }
        for (let item of list) {
            output.add(new Intl.Locale(item));
            this._enumerateFallbacksToSet(item, output);
        }
    }

    /**
     * Retrieves message and formats it. Returns `null` if undefined.
     */
    getMessage(id: string, args: undefined | Record<string, FluentVariable> = undefined, errors: null | Error[] = null): string | null {
        if (!this._currentLocale) {
            return null;
        }
        return this._getMessageByLocale(id, this._currentLocale.toString(), args, errors);
    }

    private _getMessageByLocale(id: string, locale: string, args: undefined | Record<string, FluentVariable>, errors: null | Error[]): string | null {
        let assets = this._assets.get(locale);
        if (assets) {
            let msg = assets.getMessage(id);
            if (msg !== undefined) {
                if (msg.value !== null)
                {
                    return assets.formatPattern(msg.value, args, errors);
                }
                return "";
            }
        }
        let fallbacks = this._fallbacks.get(locale);
        if (fallbacks) {
            for (let fl of fallbacks) {
                let r = this._getMessageByLocale(id, fl, args, errors);
                if (r !== null) {
                    return r;
                }
            }
        }
        return null;
    } // _getMessageByLocale

    /**
     * Determines if a message is defined.
     */
    hasMessage(id: string) {
        return this._currentLocale ? this._hasMessageByLocale(id, this._currentLocale.toString()) : false;
    }

    private _hasMessageByLocale(id: string, locale: string) {
        let assets = this._assets.get(locale);
        if (assets) {
            let msg = assets.getMessage(id);
            if (msg !== undefined) {
                return true;
            }
        }
        let fallbacks = this._fallbacks.get(locale);
        if (fallbacks) {
            for (let fl of fallbacks) {
                if (this._hasMessageByLocale(id, fl)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Clones the `FluentBox` object, but returning an object that is
     * in sync with the original `FluentBox` object.
     */
    clone() {
        let r = new FluentBox(FluentBox._PRIVATE_CTOR);
        r._currentLocale = this._currentLocale;
        r._localeToPathComponents = this._localeToPathComponents;
        r._supportedLocales = this._supportedLocales;
        r._defaultLocale = this._defaultLocale;
        r._fallbacks = this._fallbacks;
        r._bundleInitializers = this._bundleInitializers;
        r._assets = this._assets;
        r._assetsSource = this._assetsSource;
        r._assetsFiles = this._assetsFiles;
        r._cleanUnusedAssets = this._cleanUnusedAssets;
        r._loadMethod = this._loadMethod;
        return r;
    }
}

export type FluentBoxOptions = {
    supportedLocales: string[];
    fallbacks?: Record<string, string[]>;
    defaultLocale: string;
    assetSource: string;
    assetFiles: string[];
    cleanUnusedAssets: boolean;
    loadMethod: "http" | "fileSystem";
};

export type BundleInitializer = (locale: Intl.Locale, bundle: FluentBundle) => void;