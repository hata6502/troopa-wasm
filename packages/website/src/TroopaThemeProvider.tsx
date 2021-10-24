import { ThemeProvider, createTheme, useMediaQuery } from "@material-ui/core";
import { memo, useMemo } from "react";
import type { FunctionComponent } from "react";

const TroopaThemeProvider: FunctionComponent = memo(({ children }) => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          type: prefersDarkMode ? "dark" : "light",
          primary: {
            main: "#ffc107",
          },
          secondary: {
            main: "#3d5afe",
          },
        },
      }),
    [prefersDarkMode]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
});

export { TroopaThemeProvider };
