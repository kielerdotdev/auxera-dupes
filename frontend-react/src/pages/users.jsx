import { useState } from 'react';
import {
	Box,
	Text,
	Skeleton,
	Table,
	Thead,
	Tbody,
	Tr,
	Td,
	Th,
} from '@chakra-ui/react';
import SearchBar from '../components/searchbar';
import { engine } from '../services/api';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';

export default function UsersPage() {
	const [query, setQuery] = useState('');

	const { data, isSuccess } = useQuery(['users', query], async () => {
		const { data } = await engine.get(`/users?query=${query}`);
		return data;
	});

	const UsersData = ({ isLoaded, users }) => {
		if (isLoaded && users) {
			return users.map(user => (
				<Tr key={user._id}>
					<Td>
						<Link to={user._id && `/user/${user._id}`}>{user.name}</Link>
					</Td>
					<Td>{user.steamId}</Td>
					<Td>{user.roles?.join(', ')}</Td>
				</Tr>
			));
		}

		return null;
	};

	return (
		<Box
			paddingLeft={['0px', '10%', '25%']}
			paddingRight={['0px', '10%', '25%']}
			height="1000px"
		>
			<SearchBar
				onQuery={input => {
					setQuery(input);
				}}
			/>

			<Box mt="1em" mb="1em" background="gray.900" height="100%" p="8px">
				<Text textAlign="center" fontSize="6xl">
					Brugere
				</Text>

				<Skeleton isLoaded={isSuccess} bg="teal">
					<Table variant="simple">
						<Thead>
							<Tr>
								<Th>Navn</Th>
								<Th>SteamID</Th>
								<Th>Roller</Th>
							</Tr>
						</Thead>
						<Tbody>
							<UsersData isLoaded={isSuccess} users={data} />
						</Tbody>
					</Table>
				</Skeleton>
			</Box>
		</Box>
	);
}
