import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { InspectionProvider, InspectionOverlays } from '@zargaryanvh/react-component-inspector';
import App from './App';

const theme = createTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <InspectionProvider>
        <App />
        <InspectionOverlays />
      </InspectionProvider>
    </ThemeProvider>
  </React.StrictMode>
);
