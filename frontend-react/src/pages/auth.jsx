// src/pages/index.js
import { useState } from 'react';
import { Box, Button, Text } from '@chakra-ui/react';
import { useUser } from '../context/user';

export default function AuthPage() {
	const [state, setState] = useState('initial');
	const { ready, loggedIn, redirectToAuth, setAccessToken } = useUser();

	const handle = async accessToken => {
		setState('loading');
		if (loggedIn) {
			return;
		}

		if (!accessToken) {
			redirectToAuth();
			throw new Error('invalid accessToken');
		}

		await setAccessToken(accessToken);
	};

	if (state === 'initial' && ready) {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const code = urlParams.get('token');

		handle(code)
			.then(() => {
				setState('success');
				// todo: redirect...
				const redirectTo = sessionStorage.getItem('redirectAuth');
				if (redirectTo) {
					window.location.href = redirectTo;
				}
			})
			.catch(error => {
				setState(JSON.stringify(error));
			});
	}

	return (
		<>
			<Box p={8}>
				{!['initial', 'loading', 'success'].includes(state) && (
					<Button onClick={redirectToAuth}>Try Agian</Button>
				)}
				<Text>{state}</Text>
			</Box>
		</>
	);
}
