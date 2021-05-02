import "core-js";
import "regenerator-runtime";

import CssBaseline from "@material-ui/core/CssBaseline";
import {
  createMuiTheme,
  StylesProvider,
  ThemeProvider,
} from "@material-ui/core/styles";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import ReactDOM from "react-dom";
import { App } from "./App";

const main = () => {
  if (process.env["NODE_ENV"] === "production") {
    Sentry.init({
      dsn: process.env["SENTRY_DSN"],
      integrations: [new Integrations.BrowserTracing()],
      tracesSampleRate: 1.0,
    });
  }

  const theme = createMuiTheme({
    palette: {
      primary: {
        main: "#3650fe",
      },
      secondary: {
        main: "#cb00af",
      },
    },
  });

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
};

main();
