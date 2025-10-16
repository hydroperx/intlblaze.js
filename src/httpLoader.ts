import { addFTLBundleResource } from "./bundleUtils";
import axios from "axios";
import type { IntlBlaze } from ".";
import { FluentBundle } from "@fluent/bundle";

export default function loader(
  self: IntlBlaze,
  locale: Intl.Locale,
  localeAsStr: string,
  bundle: FluentBundle,
): Promise<[string, FluentBundle]> {
  return Promise.all(
    self._files.slice(0).map((fileName) => {
      let localePathComp = self._localeToPathComponents.get(localeAsStr);
      if (localePathComp === undefined) {
        throw new Error(`Fallback is not a supported locale: ${localeAsStr}`);
      }
      let resPath = `${self._source}/${localePathComp}/${fileName}.ftl`;
      return new Promise((resolve, reject) => {
        axios({
          method: "get",
          url: resPath,
          responseType: "text",
        })
          .then((response) => {
            addFTLBundleResource(fileName, response.data, bundle);
            resolve(undefined);
          })
          .catch((error) => {
            console.error(`Failed to load resource at ${resPath}`);
            reject(undefined);
          });
      });
    }),
  ).then((_) => {
    return [localeAsStr, bundle];
  });
}
