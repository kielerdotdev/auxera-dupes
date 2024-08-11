// src/pages/index.js
import { useState } from 'react';
import { Flex, Box } from '@chakra-ui/react';
import Item from '../components/item';
import SearchBar from '../components/searchbar';
import { useUser } from '../context/user';
import { useHomeScreen } from '../services/api';

export default function IndexPage() {
	const [query, setQuery] = useState('');
	const { ready } = useUser();

	const { status, error, data } = useHomeScreen(query, ready);

	if (status === 'error') {
		return <h1>{error.message} </h1>;
	}

	return (
		<Box
			margin="auto"
			w={{ base: 'calc(100% - 2rem)', sm: '28rem', md: '46rem', lg: '60rem' }}
		>
			<SearchBar
				onQuery={input => {
					setQuery(input);
				}}
			/>

			<Flex
				wrap="wrap"
				mt="1em"
				mb="1em"
				style={{
					gap: '1em',
				}}
			>
				{status === 'success'
					? data.map(item => <Item key={item._id} item={item} />)
					: [...Array(10)].map((_, index) => <Item key={index} loading />)}
			</Flex>
		</Box>
	);
}
