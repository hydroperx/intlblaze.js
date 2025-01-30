const fs = require('fs');
const path = require('path');
const { addFTLBundleResource } = require('./bundleUtils.js');

module.exports = (self, locale, localeAsStr, bundle) => {
    for (let fileName of self._assetFiles) {
        let localePathComp = self._localeToPathComponents.get(localeAsStr);
        if (localePathComp === undefined) {
            throw new Error(`Fallback is not a supported locale: ${localeAsStr}`);
        }
        let resPath = `${self._assetSource}/${localePathComp}/${fileName}.ftl`;
        try {
            let source = fs.readFileSync(path.resolve(resPath), 'utf8');
            addFTLBundleResource(fileName, source, bundle);
        }
        catch (err) {
            console.error(`Failed to load resource at ${resPath}`);
            return Promise.reject(undefined);
        }
    }
    return Promise.resolve([localeAsStr, bundle]);
};