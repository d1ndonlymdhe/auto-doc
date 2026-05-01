import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css';

import { MantineProvider, createTheme, type MantineColorsTuple} from '@mantine/core';
import './index.css'
import App from './App.tsx'

const myColor: MantineColorsTuple = [
  '#ffe9f8',
  '#ffd2ea',
  '#f9a2d0',
  '#f25ead',
  '#ef46a0',
  '#ed2b92',
  '#ed1c8b',
  '#d30c78',
  '#bd006b',
  '#a6005c'
];

const theme = createTheme({
  colors: {
    myColor,
  },
  primaryColor: 'myColor',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
