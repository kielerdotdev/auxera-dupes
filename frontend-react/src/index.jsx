import ReactDOM from 'react-dom';
import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Providers from './context/global';
import Router from './router';
import Header from './components/header';

const theme = extendTheme({
	fonts: {
		body:
			'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
	},
	config: {
		initialColorMode: 'dark',
		useSystemColorMode: false,
	},
});

export function App() {
	return (
		<ChakraProvider theme={theme} resetCSS={true} colorModeManager={true}>
			<Providers>

				<Router>
					<Header />
				</Router>
			</Providers>
		</ChakraProvider>
	);
}

ReactDOM.render(<App />, document.getElementById('root'));
