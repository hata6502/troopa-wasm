import "core-js";
import "regenerator-runtime";

import { CssBaseline } from "@material-ui/core";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import ReactDOM from "react-dom";
import { App } from "./App";
import { TroopaThemeProvider } from "./TroopaThemeProvider";

const main = () => {
  if (process.env["NODE_ENV"] === "production") {
    Sentry.init({
      dsn: process.env["SENTRY_DSN"],
      beforeSend: (event) => {
        if (event.exception) {
          Sentry.showReportDialog({ eventId: event.event_id });
        }

        return event;
      },
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
    <Sentry.ErrorBoundary
      fallback={
        <>
          Sorry, an error has occurred.
          <br />
          Please load again.
          <br />
          <a
            href="https://helpfeel.com/hata6502/?kinds=troopa"
            rel="noreferrer"
            target="_blank"
          >
            Help
          </a>
        </>
      }
    >
      <TroopaThemeProvider>
        <CssBaseline />
        <App />
      </TroopaThemeProvider>
    </Sentry.ErrorBoundary>,
    document.querySelector("#app")
  );
};

main();
