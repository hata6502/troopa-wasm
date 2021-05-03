import { AppBar, Button, Grid, Toolbar, Typography } from "@material-ui/core";
import { memo, useCallback, useState } from "react";
import type { FunctionComponent } from "react";

const App: FunctionComponent = memo(() => {
  const [audioContext, setAudioContext] = useState<AudioContext>();

  const handlePlayButtonClick = useCallback(()=> {
    const audioContext = new AudioContext();
    const scriptNode = audioContext.createScriptProcessor(undefined, 0, 1);
  
    scriptNode.addEventListener('audioprocess', (event) => {
      const channelData = event.outputBuffer.getChannelData(0);
  
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin(i++);
      }
    });
  
    scriptNode.connect(audioContext.destination);

    setAudioContext(audioContext);
  }, []);


  const handleStopButtonClick = useCallback(()=> 
    audioContext?.close()
  , []);

  return (
    <>
      <AppBar color="inherit" position="sticky">
        <Toolbar>
          <Grid container spacing={2} alignItems="baseline">
              <Grid item>
                <Typography variant="h6">troopa</Typography>
              </Grid>

              <Grid item>
                <Typography variant="subtitle1">web toy synthesizer</Typography>
              </Grid>
            </Grid>
        </Toolbar>
      </AppBar>

      <main>
        <Button onClick={handlePlayButtonClick}>Play</Button>
        <Button onClick={handleStopButtonClick}>Stop</Button>
      </main>
    </>
  );
});

export { App };
