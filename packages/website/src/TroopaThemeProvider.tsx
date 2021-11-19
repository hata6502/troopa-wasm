import { ThemeProvider, createTheme, useMediaQuery } from "@material-ui/core";
import { FunctionComponent, memo, useMemo } from "react";

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
            main: "#f50057",
          },
        },
      }),
    [prefersDarkMode]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
});

export { TroopaThemeProvider };
