import supportedBrowsers from "./supportedBrowsers.json";
import { supportedBrowsersRegExp } from "./supportedBrowsersRegExp";

if (!supportedBrowsersRegExp.test(navigator.userAgent)) {
  alert(`Please access again with the following browser.

${supportedBrowsers.browsers.map((browser) => `・${browser}`).join("\n")}
`);
}
