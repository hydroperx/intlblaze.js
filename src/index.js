const fileSystemLoader = require('./fileSystemLoader.nodejs.js');
const httpLoader = require('./httpLoader.js');
const { FluentBundle, FluentResource } = require('@fluent/bundle');

class FTL {
    _currentLocale = null;

    // Map<string, string>
    // Maps a locale identifier String to its equivalent path component.
    // The string mapped depends in how the
    // FTL object was constructed. If the `supportedLocales` option
    // contains "en-us", then `_localeToPathComponents.get(new Locale("en-US").toString())` returns "en-us".
    // When FTLs are loaded, this component is appended to the URL or file path;
    // for example, `"res/lang/en-us"`.
    _localeToPathComponents = new Map;

    _supportedLocales = new Set;
    _defaultLocale = null;
    _fallbacks = new Map;
    _assets = new Map;
    _assetsSource = '';
    _assetsFiles = [];
    _bundleInitializers = [];
    _cleanUnusedAssets = true;
    _loadMethod = 'http';

    static _parseLocaleOrThrow(s) {
        try {
            return new Intl.Locale(s);
        } catch (e) {
            throw new Error(`${s} is a malformed locale`);
        }
    }

    static _PRIVATE_CTOR = {};

    constructor(options) {
        if (options === FTL._PRIVATE_CTOR) {
            return;
        }
        if (typeof options !== 'object') {
            throw new Error('Invalid options argument');
        }
        if (!(options.supportedLocales instanceof Array)) {
            throw new Error('options.supportedLocales must be an Array');
        }
        for (let unparsedLocale of options.supportedLocales) {
            let parsedLocale = FTL._parseLocaleOrThrow(unparsedLocale);
            this._localeToPathComponents.set(parsedLocale.toString(), unparsedLocale);
            this._supportedLocales.add(parsedLocale.toString());
        }
        let fallbacks = options.fallbacks || {};
        for (let fallbackUnparsedLocale in fallbacks) {
            let fallbackParsedLocale = FTL._parseLocaleOrThrow(fallbackUnparsedLocale);
            let fallbackArray = fallbacks[fallbackUnparsedLocale];
            if (!fallbackArray) {
                throw new Error('options.fallbacks must map Locales to Arrays');
            }
            this._fallbacks.set(fallbackParsedLocale.toString(), fallbackArray.map(a => {
                if (typeof a !== 'string') {
                    throw new Error('options.fallbacks object is malformed');
                }
                return FTL._parseLocaleOrThrow(a).toString();
            }));
        }
        if (typeof options.defaultLocale !== 'string') {
            throw new Error('options.defaultLocale must be a String');
        }
        this._defaultLocale = FTL._parseLocaleOrThrow(options.defaultLocale);
        if (typeof options.assetSource !== 'string') {
            throw new Error('options.assetSource must be a String');
        }
        this._assetSource = String(options.assetSource);
        if (!(options.assetFiles instanceof Array)) {
            throw new Error('options.assetFiles must be an Array');
        }
        this._assetFiles = [];
        for (let fileName of options.assetFiles) {
            this._assetFiles.push(fileName);
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
    } // FTL constructor

    addBundleInitializer(fn) {
        this._bundleInitializers.push(fn);
    }

    get supportedLocales() {
        let r = new Set;
        for (let v of this._supportedLocales) {
            r.add(new Locale(v));
        }
        return r;
    }

    supportsLocale(argument) {
        return this._supportedLocales.has(argument.toString());
    }

    get currentLocale() {
        return this._currentLocale;
    }

    get localeAndFallbacks() {
        if (this._currentLocale) {
            let r = [this._currentLocale];
            this._enumerateFallbacks(this._currentLocale.toString(), r);
            return r;
        }
        return [];
    }

    get fallbacks() {
        if (this._currentLocale) {
            let r = [];
            this._enumerateFallbacks(this._currentLocale.toString(), r);
            return r;
        }
        return [];
    }

    load(newLocale = null) {
        newLocale ||= this._defaultLocale;
        if (!(newLocale instanceof Intl.Locale)) {
            throw new Error(`Locale argument must be an Intl.Locale object`);
        }
        if (!this.supportsLocale(newLocale)) {
            throw new Error(`Unsupported locale: ${newLocale.toString()}`);
        }
        let self = this;
        return new Promise((resolve, reject) => {
            let toLoad = new Set([newLocale]);
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
                        bundleInit(newLocale, self._assets.get(newLocale.toString()));
                    }

                    resolve(true);
                })
                .catch(_ => {
                    resolve(false);
                });
        });
    } // load

    get _assetFilesAsUntyped() {
        let r = [];
        for (let v of this._assetFiles) {
            r.push(v);
        }
        return r;
    }

    // should resolve to [string, FluentBundle] (the first String is locale.toString())
    _loadSingleLocale(locale) {
        let self = this;
        let localeAsStr = locale.toString();
        let bundle = new FluentBundle(locale);

        if (this._loadMethod == 'fileSystem') {
            return fileSystemLoader(self, locale, localeAsStr, bundle);
        } else {
            return httpLoader(self, locale, localeAsStr, bundle);
        }
    }

    _enumerateFallbacks(locale, output) {
        let list = this._fallbacks.get(locale);
        if (!list) {
            return;
        }
        for (let item of list) {
            output.push(new Locale(item));
            this._enumerateFallbacks(item, output);
        }
    }

    _enumerateFallbacksToSet(locale, output) {
        let list = this._fallbacks.get(locale);
        if (!list) {
            return;
        }
        for (let item of list) {
            output.add(new Locale(item));
            this._enumerateFallbacksToSet(item, output);
        }
    }

    getMessage(id, args = undefined, errors = null) {
        if (!this._currentLocale) {
            return null;
        }
        return this._getMessageByLocale(id, this._currentLocale.toString(), args, errors);
    }

    _getMessageByLocale(id, locale, args, errors) {
        let assets = this._assets.get(locale);
        if (assets) {
            let msg = assets.getMessage(id);
            if (msg !== undefined) {
                return assets.formatPattern(msg.value, args, errors);
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

    hasMessage(id) {
        return this._currentLocale ? this._hasMessageByLocale(id, this._currentLocale.toString()) : false;
    }

    _hasMessageByLocale(id, locale) {
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

    clone() {
        let r = new FTL(FTL._PRIVATE_CTOR);
        r._currentLocale = this._currentLocale;
        r._localeToPathComponents = this._localeToPathComponents;
        r._supportedLocales = this._supportedLocales;
        r._defaultLocale = this._defaultLocale;
        r._fallbacks = this._fallbacks;
        r._bundleInitializers = this._bundleInitializers;
        r._assets = this._assets;
        r._assetSource = this._assetSource;
        r._assetFiles = this._assetFiles;
        r._cleanUnusedAssets = this._cleanUnusedAssets;
        r._loadMethod = this._loadMethod;
        return r;
    }
}

exports.FTL = FTL;