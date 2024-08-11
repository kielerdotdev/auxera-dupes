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
import { useUser } from '../context/user';
import {
	useYourItems,
	useItemColor,
	currencyFormat,
	useLatestItemVersion,
} from '../services/api';
import { Link } from 'react-router-dom';

function ProductDataRow({ user, item }) {
	const currentVersion = useLatestItemVersion(item);
	const backgroundColor = useItemColor(user, item);

	return (
		<Tr background={backgroundColor}>
			<Td>
				<Link to={item._id && `/details/${item._id}`}>{item.title}</Link>
			</Td>
			<Td>{currencyFormat(item.price)}</Td>
			<Td>{currentVersion?.version ?? 'Ingen'}</Td>
		</Tr>
	);
}

export default function ProductsPage() {
	const { user } = useUser();

	const itemsData = useYourItems();
	console.log('itemsData', itemsData);

	const ProductData = ({ isLoaded, items }) => {
		if (isLoaded && items) {
			return items.map(item => (
				<ProductDataRow user={user} item={item} key={item._id} />
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
			<Box background="gray.900" height="100%" p="8px">
				<Text textAlign="center" fontSize="6xl">
					Dine produkter
				</Text>

				<Skeleton isLoaded={itemsData.isSuccess} bg="teal">
					<Table variant="simple">
						<Thead>
							<Tr>
								<Th>Title</Th>
								<Th>Pris</Th>
								<Th>Version</Th>
							</Tr>
						</Thead>
						<Tbody>
							<ProductData
								isLoaded={itemsData.isSuccess}
								items={itemsData.data}
							/>
						</Tbody>
					</Table>
				</Skeleton>
			</Box>
		</Box>
	);
}
