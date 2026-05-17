import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { InspectionWrapper } from '@zargaryanvh/react-component-inspector';

export default function App() {
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        React Component Inspector — Demo
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Hold <b>CTRL</b> and hover over any element. Hold <b>CTRL+ALT</b> to inspect spacing.
      </Typography>

      <Stack spacing={3}>
        <InspectionWrapper componentName="LoginCard" filePath="example/src/App.tsx">
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

        <InspectionWrapper componentName="ActionBar" filePath="example/src/App.tsx">
          <Stack direction="row" spacing={2}>
            <Button variant="outlined">Cancel</Button>
            <Button variant="contained" color="primary">Save</Button>
            <Button variant="contained" color="error">Delete</Button>
          </Stack>
        </InspectionWrapper>

        <InspectionWrapper componentName="InfoBox" filePath="example/src/App.tsx">
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">
              This is a sample InfoBox component to test margin/padding inspection.
            </Typography>
          </Box>
        </InspectionWrapper>
      </Stack>
    </Box>
  );
}
