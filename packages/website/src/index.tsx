import "core-js";
import "regenerator-runtime";

import CssBaseline from "@material-ui/core/CssBaseline";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import ReactDOM from "react-dom";
import { App } from "./App";

const main = async () => {
  if (process.env["NODE_ENV"] === "production") {
    Sentry.init({
      dsn: process.env["SENTRY_DSN"],
      integrations: [new Integrations.BrowserTracing()],
      tracesSampleRate: 1.0,
    });
  }

  const core = await import("core-wasm/core_wasm");

  core.truncate();
  core.init();

  /*setInterval(() => {
    core.next_tick();
    console.log(core.get_output_value(1));
    console.log(core.get_output_value(2));
  }, 16);*/

  ReactDOM.render(
    <>
      <CssBaseline />
      <App />
    </>,
    document.querySelector(".app")
  );
};

main();
