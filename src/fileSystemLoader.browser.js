module.exports = (self, locale, localeAsStr, bundle) => {
    console.error(`File system Fluent Translation Lists not supported in browser`);
    return Promise.reject(undefined);
};