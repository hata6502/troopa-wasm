import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { memo } from "react";
import type { FunctionComponent } from "react";
import { Helmet } from "react-helmet";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { GitHubReport } from "./GitHubReport";
import { NotFound } from "./NotFound";

const App: FunctionComponent = memo(() => (
  <>
    <Helmet defaultTitle="jscpd" titleTemplate="%s | jscpd" />

    <Box mb={4}>
      <AppBar color="inherit" position="static">
        <Toolbar>
          <Link
            color="inherit"
            href="https://github.com/hata6502/jscpd-service"
            rel="noopener"
            target="_blank"
          >
            <Grid container spacing={2} alignItems="baseline">
              <Grid item>
                <Typography variant="h6">jscpd</Typography>
              </Grid>

              <Grid item>
                <Typography variant="subtitle1">Copy/Paste Detector</Typography>
              </Grid>
            </Grid>
          </Link>
        </Toolbar>
      </AppBar>
    </Box>

    <main>
      <BrowserRouter>
        <Switch>
          <Route path="/github/:repositoryFullName([a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-.]+)">
            <GitHubReport />
          </Route>

          <Route path="*">
            <NotFound />
          </Route>
        </Switch>
      </BrowserRouter>
    </main>
  </>
));

export { App };
