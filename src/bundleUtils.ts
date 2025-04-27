import { FluentBundle, FluentResource } from "@fluent/bundle";

export function addFTLBundleResource(
  fileName: string,
  source: string,
  bundle: FluentBundle,
) {
  try {
    let res = new FluentResource(source);
    let resErrors = bundle.addResource(res);
    if (resErrors.length > 0) {
      for (let error of resErrors) {
        console.error(`Error at ${fileName}.ftl: ${error.message}`);
      }
      return false;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Error at ${fileName}.ftl: ${error.message}`);
      return false;
    } else {
      throw error;
    }
  }
  return true;
} // addFTLBundleResource
