import { useReducer } from 'react';
import {
	Box,
	Text,
	Skeleton,
	Flex,
	Button,
	IconButton,
	Checkbox,
	Menu,
	MenuButton,
	MenuList,
	MenuGroup,
	MenuItem,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalCloseButton,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { engine } from '../services/api';
import { useUser } from '../context/user';
import { useQuery, useMutation } from 'react-query';

const reducer = (state, role) => {
	if (state.includes(role)) {
		return state.filter(element => element !== role);
	}

	return [...state, role];
};

const settingsRoles = [
	['author', 'Author'],
	['obfuscate', 'Obfuscate'],
	['security', 'Security'],
	['admin', 'Admin'],
];

function UserSettings({ userId, roles, refetch }) {
	const [currentRoles, dispatch] = useReducer(reducer, roles);
	const { isOpen, onOpen, onClose } = useDisclosure();

	const { mutate } = useMutation(async roles => {
		const { data } = await engine.post(`admin/users/${userId}/roles/`, {
			roles,
		});

		return data;
	});

	return (
		<Menu>
			<MenuButton
				as={IconButton}
				icon={<SettingsIcon />}
				float="right"
				mr="8px"
			/>
			<MenuList>
				<MenuGroup title="Admin">
					<MenuItem onClick={onOpen}>Opdater roller</MenuItem>
				</MenuGroup>
			</MenuList>

			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Modal Title</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						{settingsRoles.map(([index, display]) => {
							return (
								<Checkbox
									key={index}
									isChecked={currentRoles.includes(index)}
									onChange={() => {
										dispatch(index);
									}}
								>
									{display}
								</Checkbox>
							);
						})}
					</ModalBody>

					<ModalFooter>
						<Button
							colorScheme="blue"
							mr={3}
							onClick={() => {
								mutate(currentRoles, {
									onSuccess: () => {
										refetch();
									},
								});

								onClose();
							}}
						>
							Opdatér og luk
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Menu>
	);
}

export default function UserPage({ match }) {
	const userId = match.params.userId;
	const { user } = useUser();

	const { data, isSuccess, refetch } = useQuery(
		[`user`, userId],
		async ({ queryKey }) => {
			const [, userId] = queryKey;
			const { data } = await engine.get(`/users/${userId}`);
			return data;
		}
	);

	return (
		<Box
			paddingLeft={['0px', '10%', '25%']}
			paddingRight={['0px', '10%', '25%']}
			height="1000px"
		>
			<Box background="gray.900" height="100%" p="8px">
				<Skeleton isLoaded={isSuccess} bg="teal">
					<Box mt="18px">
						<Flex>
							<Text>Navn:</Text>
							<Text fontWeight="bold" ml="8px">
								{data?.name}
							</Text>
						</Flex>

						<Flex>
							<Text>SteamID:</Text>
							<Text fontWeight="bold" ml="8px">
								{data?.steamId}
							</Text>
						</Flex>

						<Flex>
							<Text>Roller:</Text>
							<Text fontWeight="bold" ml="8px">
								{data?.roles?.join(', ')}
							</Text>
						</Flex>

						{user?.roles?.includes('admin') ? (
							<Flex>
								{data?.roles ? (
									<UserSettings
										userId={data._id}
										roles={data.roles}
										refetch={refetch}
									/>
								) : null}
							</Flex>
						) : null}
					</Box>
				</Skeleton>
			</Box>
		</Box>
	);
}
