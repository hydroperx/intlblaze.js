[**@hydroperx/tradur**](../README.md)

***

[@hydroperx/tradur](../globals.md) / Tradur

# Class: Tradur

Defined in: [src/index.ts:9](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L9)

Manages Project Fluent translation lists (FTL) and translate
messages.

## Extends

- `EventTarget`

## Constructors

### Constructor

> **new Tradur**(`params`): `Tradur`

Defined in: [src/index.ts:46](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L46)

#### Parameters

##### params

[`TradurParams`](../type-aliases/TradurParams.md)

#### Returns

`Tradur`

#### Overrides

`EventTarget.constructor`

## Accessors

### currentLocale

#### Get Signature

> **get** **currentLocale**(): `null` \| `Locale`

Defined in: [src/index.ts:137](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L137)

Returns the currently loaded locale or null if none.

##### Returns

`null` \| `Locale`

***

### fallbacks

#### Get Signature

> **get** **fallbacks**(): `Locale`[]

Defined in: [src/index.ts:156](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L156)

Returns the currently loaded fallbacks.

##### Returns

`Locale`[]

***

### localeAndFallbacks

#### Get Signature

> **get** **localeAndFallbacks**(): `Locale`[]

Defined in: [src/index.ts:144](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L144)

Returns the currently loaded locale followed by its fallbacks or empty if no locale is loaded.

##### Returns

`Locale`[]

***

### locales

#### Get Signature

> **get** **locales**(): `Set`\<`Locale`\>

Defined in: [src/index.ts:117](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L117)

Returns a set of supported locales, reflecting
the ones that were specified when constructing the `Tradur` object.

##### Returns

`Set`\<`Locale`\>

***

### status

#### Get Signature

> **get** **status**(): [`TradurStatus`](../type-aliases/TradurStatus.md)

Defined in: [src/index.ts:169](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L169)

Returns the status of the `Tradur` instance
(e.g., `"ok"`, `"loading"` or `"error"`).

##### Returns

[`TradurStatus`](../type-aliases/TradurStatus.md)

## Methods

### addBundleInitializer()

> **addBundleInitializer**(`fn`): `void`

Defined in: [src/index.ts:109](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L109)

Adds a bundle initializer. This allows defining custom functions and more.

#### Parameters

##### fn

[`BundleInitializer`](../type-aliases/BundleInitializer.md)

#### Returns

`void`

***

### addEventListener()

> **addEventListener**(`type`, `callback`, `options?`): `void`

Defined in: node\_modules/typescript/lib/lib.dom.d.ts:8303

Appends an event listener for events whose type attribute value is type. The callback argument sets the callback that will be invoked when the event is dispatched.

The options argument sets listener-specific options. For compatibility this can be a boolean, in which case the method behaves exactly as if the value was specified as options's capture.

When set to true, options's capture prevents callback from being invoked when the event's eventPhase attribute value is BUBBLING_PHASE. When false (or not present), callback will not be invoked when event's eventPhase attribute value is CAPTURING_PHASE. Either way, callback will be invoked if event's eventPhase attribute value is AT_TARGET.

When set to true, options's passive indicates that the callback will not cancel the event by invoking preventDefault(). This is used to enable performance optimizations described in § 2.8 Observing event listeners.

When set to true, options's once indicates that the callback will only be invoked once after which the event listener will be removed.

If an AbortSignal is passed for options's signal, then the event listener will be removed when signal is aborted.

The event listener is appended to target's event listener list and is not appended if it has the same type, callback, and capture.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)

#### Parameters

##### type

`string`

##### callback

`null` | `EventListenerOrEventListenerObject`

##### options?

`boolean` | `AddEventListenerOptions`

#### Returns

`void`

#### Inherited from

`EventTarget.addEventListener`

***

### clone()

> **clone**(): `Tradur`

Defined in: [src/index.ts:384](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L384)

Clones the `Tradur` object, but returning an object that is
in sync with the original `Tradur` object.

#### Returns

`Tradur`

***

### dispatchEvent()

> **dispatchEvent**(`event`): `boolean`

Defined in: node\_modules/typescript/lib/lib.dom.d.ts:8309

Dispatches a synthetic event event to target and returns true if either event's cancelable attribute value is false or its preventDefault() method was not invoked, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent)

#### Parameters

##### event

`Event`

#### Returns

`boolean`

#### Inherited from

`EventTarget.dispatchEvent`

***

### get()

> **get**(`id`, `args`, `errors`): `null` \| `string`

Defined in: [src/index.ts:268](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L268)

Retrieves message and formats it. Returns `null` if undefined.

#### Parameters

##### id

`string`

##### args

`undefined` | `Record`\<`string`, `FluentVariable`\>

##### errors

`null` | `Error`[]

#### Returns

`null` \| `string`

***

### has()

> **has**(`id`): `boolean`

Defined in: [src/index.ts:321](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L321)

Determines if a message is defined.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### load()

> **load**(`newLocale`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:185](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L185)

Attempts to load a locale and its fallbacks.
If the locale argument is specified, it is loaded.
Otherwise, if there is a default locale, it is loaded, and if not,
the method throws an error.

If any resource fails to load, the returned `Promise`
resolves to `false`, otherwise `true`.

Also dispatches either the `load` or `error` event,
when loading is completed.

#### Parameters

##### newLocale

`null` | `Locale`

#### Returns

`Promise`\<`boolean`\>

***

### off()

#### Call Signature

> **off**\<`T`\>(`type`, `listener`, `params?`): `void`

Defined in: [src/index.ts:369](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L369)

Shortcut for the `removeEventListener()` method.

##### Type Parameters

###### T

`T` *extends* keyof [`TradurEventMap`](../type-aliases/TradurEventMap.md)

##### Parameters

###### type

`T`

###### listener

(`event`) => `void`

###### params?

`boolean` | `EventListenerOptions`

##### Returns

`void`

#### Call Signature

> **off**(`type`, `listener`, `params?`): `void`

Defined in: [src/index.ts:374](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L374)

Shortcut for the `removeEventListener()` method.

##### Parameters

###### type

`string`

###### listener

`Function`

###### params?

`boolean` | `EventListenerOptions`

##### Returns

`void`

***

### on()

#### Call Signature

> **on**\<`T`\>(`type`, `listener`, `params?`): `void`

Defined in: [src/index.ts:355](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L355)

Shortcut for the `addEventListener()` method.

##### Type Parameters

###### T

`T` *extends* keyof [`TradurEventMap`](../type-aliases/TradurEventMap.md)

##### Parameters

###### type

`T`

###### listener

(`event`) => `void`

###### params?

`boolean` | `AddEventListenerOptions`

##### Returns

`void`

#### Call Signature

> **on**(`type`, `listener`, `params?`): `void`

Defined in: [src/index.ts:360](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L360)

Shortcut for the `addEventListener()` method.

##### Parameters

###### type

`string`

###### listener

`Function`

###### params?

`boolean` | `AddEventListenerOptions`

##### Returns

`void`

***

### removeEventListener()

> **removeEventListener**(`type`, `callback`, `options?`): `void`

Defined in: node\_modules/typescript/lib/lib.dom.d.ts:8315

Removes the event listener in target's event listener list with the same type, callback, and options.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/removeEventListener)

#### Parameters

##### type

`string`

##### callback

`null` | `EventListenerOrEventListenerObject`

##### options?

`boolean` | `EventListenerOptions`

#### Returns

`void`

#### Inherited from

`EventTarget.removeEventListener`

***

### supportsLocale()

> **supportsLocale**(`argument`): `boolean`

Defined in: [src/index.ts:130](https://github.com/hydroperx/tradur.js/blob/f347be9143f2fbd50c3b535bcb3390077b13f2ec/src/index.ts#L130)

Returns `true` if the locale is one of the supported locales
that were specified when constructing the `Tradur` object,
otherwise `false`.

#### Parameters

##### argument

`string` | `Locale`

#### Returns

`boolean`
