import { Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material';
import { InspectionWrapper } from '@zargaryanvh/react-component-inspector';

const CornerChip = ({ label, position }: { label: string; position: React.CSSProperties }) => (
  <InspectionWrapper
    componentName={`Corner_${label}`}
    usagePath={`App > Corner_${label}`}
    props={{ position: label }}
    sourceFile="example/src/App.tsx"
  >
    <Chip
      label={label}
      color="primary"
      sx={{ position: 'fixed', zIndex: 10, ...position }}
    />
  </InspectionWrapper>
);

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      {/* Corner components to test tooltip clamping */}
      <CornerChip label="TopLeft"     position={{ top: 8,    left: 8 }} />
      <CornerChip label="TopRight"    position={{ top: 8,    right: 8 }} />
      <CornerChip label="BottomLeft"  position={{ bottom: 8, left: 8 }} />
      <CornerChip label="BottomRight" position={{ bottom: 8, right: 8 }} />

      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          React Component Inspector — Demo
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Hold <b>CTRL</b> and hover over any element. Try the corner chips to test edge positioning.
        </Typography>

        <Stack spacing={3}>
          <InspectionWrapper
            componentName="LoginCard"
            usagePath="App > LoginCard"
            props={{}}
            sourceFile="example/src/App.tsx"
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Sign in</Typography>
                <Stack spacing={2}>
                  <TextField label="Email" fullWidth />
                  <TextField label="Password" type="password" fullWidth />
                  <Button variant="contained">Sign in</Button>
                </Stack>
              </CardContent>
            </Card>
          </InspectionWrapper>

          <InspectionWrapper
            componentName="ActionBar"
            usagePath="App > ActionBar"
            props={{}}
            sourceFile="example/src/App.tsx"
          >
            <Stack direction="row" spacing={2}>
              <Button variant="outlined">Cancel</Button>
              <Button variant="contained" color="primary">Save</Button>
              <Button variant="contained" color="error">Delete</Button>
            </Stack>
          </InspectionWrapper>

          <InspectionWrapper
            componentName="InfoBox"
            usagePath="App > InfoBox"
            props={{ variant: 'info' }}
            sourceFile="example/src/App.tsx"
          >
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                This is a sample InfoBox component to test margin/padding inspection.
              </Typography>
            </Box>
          </InspectionWrapper>

          {/* Spacer so we have something to scroll past and corners stay reachable */}
          <Box sx={{ height: 400 }} />

          <InspectionWrapper
            componentName="FooterBox"
            usagePath="App > FooterBox"
            props={{}}
            sourceFile="example/src/App.tsx"
          >
            <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="body2">Footer area — test bottom inspection here too.</Typography>
            </Box>
          </InspectionWrapper>
        </Stack>
      </Box>
    </Box>
  );
}
