import * as fs from "fs";
import * as path from "path";
import { addFTLBundleResource } from "./bundleUtils";
import type { FluentBox } from ".";
import { FluentBundle } from "@fluent/bundle";

export default function loader(
  self: FluentBox,
  locale: Intl.Locale,
  localeAsStr: string,
  bundle: FluentBundle,
): Promise<[string, FluentBundle]> {
  if (typeof window === "object") {
    console.error(
      `File system Fluent Translation Lists are not supported in the browser.`,
    );
    return Promise.reject(undefined);
  }
  for (let fileName of self._files) {
    let localePathComp = self._localeToPathComponents.get(localeAsStr);
    if (localePathComp === undefined) {
      throw new Error(`Fallback is not a supported locale: ${localeAsStr}`);
    }
    let resPath = `${self._source}/${localePathComp}/${fileName}.ftl`;
    try {
      let source = fs.readFileSync(path.resolve(resPath), "utf8");
      addFTLBundleResource(fileName, source, bundle);
    } catch (err) {
      console.error(`Failed to load resource at ${resPath}`);
      return Promise.reject(undefined);
    }
  }
  return Promise.resolve([localeAsStr, bundle]);
}
