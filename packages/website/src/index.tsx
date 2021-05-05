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

  ReactDOM.render(
    <>
      <CssBaseline />
      <App />
    </>,
    document.querySelector(".app")
  );
};

main();
