const { addFTLBundleResource } = require('./bundleUtils.js');

// HTTP request
const axios = require('axios');

module.exports = (self, locale, localeAsStr, bundle) => {
    return Promise.all(
        self._assetFilesAsUntyped.map(
            fileName => {
                let localePathComp = self._localeToPathComponents.get(localeAsStr);
                if (localePathComp === undefined) {
                    throw new Error(`Fallback is not a supported locale: ${localeAsStr}`);
                }
                let resPath = `${self._assetSource}/${localePathComp}/${fileName}.ftl`;
                return new Promise((resolve, reject) => {
                    axios({
                        method: 'get',
                        url: resPath,
                        responseType: 'text',
                    })
                        .then(response => {
                            addFTLBundleResource(fileName, response.data, bundle);
                            resolve(undefined);
                        })
                        .catch(error => {
                            console.error(`Failed to load resource at ${resPath}`);
                            reject(undefined);
                        });
                });
            }
        )
    )
        .then(_ =>
        {
            return [localeAsStr, bundle];
        })
    ;
};