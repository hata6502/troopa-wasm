import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { memo } from "react";
import type { FunctionComponent } from "react";

const App: FunctionComponent = memo(() => (
  <>
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

    <main></main>
  </>
));

export { App };
