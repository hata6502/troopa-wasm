import "core-js";
import "regenerator-runtime";

import {
  CssBaseline,
  StylesProvider,
  ThemeProvider,
  createMuiTheme,
} from "@material-ui/core";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import ReactDOM from "react-dom";
import { App } from "./App";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#ffc107",
    },
    secondary: {
      main: "#f50057",
    },
  },
});

if (process.env["NODE_ENV"] === "production") {
  Sentry.init({
    dsn: process.env["SENTRY_DSN"],
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener(
      "load",
      () => void navigator.serviceWorker.register("service-worker.js")
    );
  }
}

ReactDOM.render(
  <>
    <CssBaseline />

    <StylesProvider injectFirst>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </StylesProvider>
  </>,
  document.querySelector(".app")
);
