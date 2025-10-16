import fsloader from "./fsLoader";
import httpLoader from "./httpLoader";
import { FluentBundle, FluentVariable } from "@fluent/bundle";

/**
 * Manages Project Fluent translation lists (FTL) and translate
 * messages.
 */
export class IntlBlaze extends EventTarget {
  private _currentLocale: Intl.Locale | null = null;

  // Maps a locale identifier String to its equivalent path component.
  // The string mapped depends in how the
  // IntlBlaze object was constructed. If the `locales` option
  // contains "en-us", then `_localeToPathComponents.get(new Intl.Locale("en-US").toString())` returns "en-us".
  // When FTLs are loaded, this component is appended to the URL or file path;
  // for example, `"res/lang/en-us"`.
  /** @hidden */
  _localeToPathComponents: Map<string, string> = new Map();

  private _status: IntlBlazeStatus = "ok";
  private _locales: Set<string> = new Set();
  private _defaultLocale: Intl.Locale | null = null;
  private _fallbacks: Map<string, string[]> = new Map();
  /** @hidden */
  _assets: Map<string, FluentBundle> = new Map();
  /** @hidden */
  _source: string = "";
  /** @hidden */
  _files: string[] = [];
  private _bundleInitializers: BundleInitializer[] = [];
  private _clean: boolean = true;
  private _method: "http" | "fileSystem" = "http";

  private static _parseLocaleOrThrow(s: string | Intl.Locale) {
    try {
      return new Intl.Locale(s);
    } catch (e) {
      throw new Error(`${s} is a malformed locale`);
    }
  }

  /** @hidden */
  static _PRIVATE_CTOR: any = {};

  constructor(params: IntlBlazeParams) {
    super();
    if (params === IntlBlaze._PRIVATE_CTOR) {
      return;
    }
    if (typeof params !== "object") {
      throw new Error("Invalid params argument");
    }
    if (!(params.locales instanceof Array)) {
      throw new Error("params.locales must be an Array");
    }
    for (let unparsedLocale of params.locales) {
      let parsedLocale = IntlBlaze._parseLocaleOrThrow(unparsedLocale);
      this._localeToPathComponents.set(parsedLocale.toString(), unparsedLocale);
      this._locales.add(parsedLocale.toString());
    }
    let fallbacks = params.fallbacks || {};
    for (let fallbackUnparsedLocale in fallbacks) {
      let fallbackParsedLocale = IntlBlaze._parseLocaleOrThrow(
        fallbackUnparsedLocale,
      );
      let fallbackArray = fallbacks[fallbackUnparsedLocale];
      if (!fallbackArray) {
        throw new Error("params.fallbacks must map Locales to Arrays");
      }
      this._fallbacks.set(
        fallbackParsedLocale.toString(),
        fallbackArray.map((a) => {
          if (typeof a !== "string") {
            throw new Error("params.fallbacks object is malformed");
          }
          return IntlBlaze._parseLocaleOrThrow(a).toString();
        }),
      );
    }
    if (typeof params.defaultLocale !== "string") {
      throw new Error("params.defaultLocale must be a String");
    }
    this._defaultLocale = IntlBlaze._parseLocaleOrThrow(params.defaultLocale);
    if (typeof params.source !== "string") {
      throw new Error("params.source must be a String");
    }
    this._source = String(params.source);
    if (!(params.files instanceof Array)) {
      throw new Error("params.files must be an Array");
    }
    this._files = [];
    for (let fileName of params.files) {
      this._files.push(fileName);
    }
    if (typeof params.clean !== "boolean") {
      throw new Error("params.clean must be a Boolean");
    }
    this._clean = !!params.clean;
    if (["http", "fileSystem"].indexOf(params.method) === -1) {
      throw new Error('params.method must be one of ["http", "fileSystem"]');
    }
    this._method = params.method;
  } // IntlBlaze constructor

  /**
   * Adds a bundle initializer. This allows defining custom functions and more.
   */
  addBundleInitializer(fn: BundleInitializer) {
    this._bundleInitializers.push(fn);
  }

  /**
   * Returns a set of supported locales, reflecting
   * the ones that were specified when constructing the `IntlBlaze` object.
   */
  get locales(): Set<Intl.Locale> {
    let r: Set<Intl.Locale> = new Set();
    for (let v of this._locales) {
      r.add(new Intl.Locale(v));
    }
    return r;
  }

  /**
   * Returns `true` if the locale is one of the supported locales
   * that were specified when constructing the `IntlBlaze` object,
   * otherwise `false`.
   */
  supportsLocale(argument: Intl.Locale | string): boolean {
    return this._locales.has(argument.toString());
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
   * Returns the status of the `IntlBlaze` instance
   * (e.g., `"ok"`, `"loading"` or `"error"`).
   */
  get status(): IntlBlazeStatus {
    return this._status;
  }

  /**
   * Attempts to load a locale and its fallbacks.
   * If the locale argument is specified, it is loaded.
   * Otherwise, if there is a default locale, it is loaded, and if not,
   * the method throws an error.
   *
   * If any resource fails to load, the returned `Promise`
   * resolves to `false`, otherwise `true`.
   * 
   * Also dispatches either the `load` or `error` event,
   * when loading is completed.
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
    this._status = "loading";
    return new Promise((resolve, reject) => {
      let toLoad: Set<Intl.Locale> = new Set([newLocale]);
      self._enumerateFallbacksToSet(newLocale.toString(), toLoad);

      let newAssets = new Map();
      Promise.all(Array.from(toLoad).map((a) => self._loadSingleLocale(a)))
        .then(res => {
          // res : [string, FluentBundle][]
          if (self._clean) {
            self._assets.clear();
          }

          for (let pair of res) {
            self._assets.set(pair[0], pair[1]);
          }
          self._currentLocale = newLocale;

          for (let bundleInit of self._bundleInitializers) {
            bundleInit(newLocale, self._assets.get(newLocale.toString())!);
          }

          this._status = "ok";
          this.dispatchEvent(new Event("load"));
          resolve(true);
        })
        .catch(_ => {
          this._status = "error";
          this.dispatchEvent(new Event("error"));
          resolve(false);
        });
    });
  } // load

  // should resolve to [string, FluentBundle] (the first String is locale.toString())
  private _loadSingleLocale(
    locale: Intl.Locale,
  ): Promise<[string, FluentBundle]> {
    let self = this;
    let localeAsStr = locale.toString();
    let bundle = new FluentBundle(localeAsStr);

    if (this._method == "fileSystem") {
      return fsloader(self, locale, localeAsStr, bundle);
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
  get(
    id: string,
    args: undefined | Record<string, FluentVariable> = undefined,
    errors: null | Error[] = null,
  ): string | null {
    if (!this._currentLocale) {
      return null;
    }
    return this._getByLocale(
      id,
      this._currentLocale.toString(),
      args,
      errors,
    );
  }

  private _getByLocale(
    id: string,
    locale: string,
    args: undefined | Record<string, FluentVariable>,
    errors: null | Error[],
  ): string | null {
    let assets = this._assets.get(locale);
    if (assets) {
      let msg = assets.getMessage(id);
      if (msg !== undefined) {
        if (msg.value !== null) {
          return assets.formatPattern(msg.value, args, errors);
        }
        return "";
      }
    }
    let fallbacks = this._fallbacks.get(locale);
    if (fallbacks) {
      for (let fl of fallbacks) {
        let r = this._getByLocale(id, fl, args, errors);
        if (r !== null) {
          return r;
        }
      }
    }
    if (this._defaultLocale !== null) {
      const nextLocale = this._defaultLocale.toString();
      if (locale.toLowerCase() !== nextLocale.toLowerCase()) {
        return this._getByLocale(id, nextLocale, args, errors);
      }
    }
    return null;
  } // _getByLocale

  /**
   * Determines if a message is defined.
   */
  has(id: string): boolean {
    return this._currentLocale
      ? this._hasByLocale(id, this._currentLocale.toString())
      : false;
  }

  private _hasByLocale(id: string, locale: string): boolean {
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
        if (this._hasByLocale(id, fl)) {
          return true;
        }
      }
    }
    if (this._defaultLocale !== null) {
      const nextLocale = this._defaultLocale.toString();
      if (locale.toLowerCase() !== nextLocale.toLowerCase()) {
        return this._hasByLocale(id, nextLocale);
      }
    }
    return false;
  }

  /**
   * Shortcut for the `addEventListener()` method.
   */
  public on<T extends keyof IntlBlazeEventMap>(
    type: T,
    listener: (event: (IntlBlazeEventMap[T] extends Event ? IntlBlazeEventMap[T] : never)) => void,
    params?: boolean | AddEventListenerOptions,
  ): void;
  public on(type: string, listener: Function, params?: boolean | AddEventListenerOptions): void;

  public on(type: string, listener: Function, params?: boolean | AddEventListenerOptions) {
    this.addEventListener(type as any, listener as any, params);
  }

  /**
   * Shortcut for the `removeEventListener()` method.
   */
  public off<T extends keyof IntlBlazeEventMap>(
    type: T,
    listener: (event: (IntlBlazeEventMap[T] extends Event ? IntlBlazeEventMap[T] : never)) => void,
    params?: boolean | EventListenerOptions,
  ): void;
  public off(type: string, listener: Function, params?: boolean | EventListenerOptions): void;

  public off(type: string, listener: Function, params?: boolean | EventListenerOptions) {
    this.removeEventListener(type as any, listener as any, params);
  }

  /**
   * Clones the `IntlBlaze` object, but returning an object that is
   * in sync with the original `IntlBlaze` object.
   */
  clone(): IntlBlaze {
    let r = new IntlBlaze(IntlBlaze._PRIVATE_CTOR);
    r._currentLocale = this._currentLocale;
    r._localeToPathComponents = this._localeToPathComponents;
    r._locales = this._locales;
    r._defaultLocale = this._defaultLocale;
    r._fallbacks = this._fallbacks;
    r._bundleInitializers = this._bundleInitializers;
    r._assets = this._assets;
    r._source = this._source;
    r._files = this._files;
    r._clean = this._clean;
    r._method = this._method;
    return r;
  }
}

export type IntlBlazeParams = {
  locales: string[];
  fallbacks?: Record<string, string[]>;
  defaultLocale: string;
  source: string;
  files: string[];
  /**
   * Whether to automatically clean unused assets or not. Setting this to `false` is ideal for servers.
   *
   * @default false
   */
  clean: boolean;
  method: "http" | "fileSystem";
};

export type BundleInitializer = (
  locale: Intl.Locale,
  bundle: FluentBundle,
) => void;

/**
 * Represents the current status of a `IntlBlaze` instance.
 */
export type IntlBlazeStatus = "ok" | "loading" | "error";

/**
 * Event types dispatched by `IntlBlaze`.
 */
export type IntlBlazeEventMap = {
  /**
   * Dispatched after successfully loading resources.
   */
  load: Event,
  /**
   * Dispatched after failing to load resources.
   */
  error: Event,
};