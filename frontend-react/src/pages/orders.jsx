import { useState } from 'react';
import {
	Box,
	Button,
	Text,
	Flex,
	AspectRatio,
	Skeleton,
	MenuButton,
	MenuList,
	Menu,
	MenuItem,
	IconButton,
	useToast,
	Tooltip,
} from '@chakra-ui/react';
import { useUser } from '../context/user';
import Image from '../components/image';
import { SettingsIcon } from '@chakra-ui/icons';
import {
	useDetails,
	usePaymentStatus,
	currencyFormat,
	useItemColor,
	engine,
} from '../services/api';
import dayjs from 'dayjs';
import { useHistory } from 'react-router-dom';

// THIS IS MUCHAL CODE I TAKE NO RESPONSIBILITY
const jsModuloIsWeird = function (a, b) {
	return ((a % b) + b) % b;
};

function downloadBase64File(contentType, base64Data, fileName) {
	const linkSource = `data:${contentType};base64,${base64Data}`;
	const downloadLink = document.createElement('a');
	downloadLink.href = linkSource;
	downloadLink.download = fileName;
	downloadLink.click();
}

function PaymentButton({ itemId, price }) {
	const { ready, loggedIn, redirectToAuth } = useUser();
	const {
		status: paymentStatus,
		data: paymentState,
		refetch: paymentRefetch,
	} = usePaymentStatus(itemId, 5000, ready && loggedIn);
	const [isItemClickLoading, setIsItemClickLoading] = useState(false);

	let loaded = paymentStatus === 'success';
	let initialState = paymentState || 'none';
	if (ready && !loggedIn) {
		initialState = 'login';
		loaded = true;
	}

	const states = {
		login: {
			text: 'Log ind for at forsætte',
			onClick: () => {
				// todo: redirect to login...
				redirectToAuth(true);
			},
			active: true,
		},
		none: {
			color: 'green',
			text: `Bestil til ${currencyFormat(price || 0)}`,
			active: true,
			onClick: async () => {
				await engine.get(`/payment/${itemId}/buy`);
				await paymentRefetch({ force: true });
			},
		},
		pending: {
			color: 'gray',
			text: 'Afventer betaling',
			tooltip: 'Åben tablet-appen in-game og accepter betalingen.',
			active: false,
			onClick: async () => {},
		},
		accepted: {
			color: 'blue',
			text: 'Download',
			active: true,
			onClick: async () => {
				const { data } = await engine.get(`/items/${itemId}/download`);
				if (data) {
					downloadBase64File('', data.content, 'downloaded-content.txt');
				}
			},
		},
	};

	const createButton = currentState => {
		return (
			<Skeleton isLoaded={loaded} float="right">
				<Button
					isLoading={isItemClickLoading}
					onClick={async () => {
						setIsItemClickLoading(true);
						try {
							await currentState.onClick();
						} catch (err) {
							console.log(err);
						}
						setIsItemClickLoading(false);
					}}
					disabled={!currentState.active}
					colorScheme={currentState.color}
				>
					{currentState.text}
				</Button>
			</Skeleton>
		);
	};

	const tooltipwrapper = (children, tooltip) => {
		return <Tooltip label={currentState.tooltip}>{children}</Tooltip>;
	};

	const currentState = states[initialState];
	const elements = createButton(currentState);

	return currentState.tooltip
		? tooltipwrapper(elements, currentState.tooltip)
		: elements;
}

function ItemSettings({ itemId, disabled, refetch }) {
	const history = useHistory();
	const toast = useToast();

	return (
		<Menu>
			<MenuButton
				as={IconButton}
				icon={<SettingsIcon />}
				float="right"
				mr="8px"
			/>
			<MenuList>
				<MenuItem onClick={() => {}}>Opdater (wip)</MenuItem>
				<MenuItem
					onClick={() => {
						history.push(`/createversion/${itemId}`);
					}}
				>
					Opret ny version
				</MenuItem>

				<MenuItem
					onClick={async () => {
						try {
							const { data } = await engine.post(
								`/items/toggleenabled/${itemId}`
							);
							toast({
								title: `${data?.disabled ? 'Disabled' : 'Enabled'} item`,
								status: 'success',
								duration: 9000,
								isClosable: true,
							});
						} catch (err) {
							console.log(err);
							toast({
								title: 'Failed enabling item',
								description: err?.data?.title || 'Invalid Status',
								status: 'error',
								duration: 9000,
								isClosable: true,
							});
						}
						refetch();
					}}
				>
					{disabled ? 'Aktiver' : 'Deaktiver'}
				</MenuItem>
			</MenuList>
		</Menu>
	);
}

export default function OrdersPage({ match }) {
	const itemId = match.params.itemId;
	const { user: userData, canEdit: userCanEdit } = useUser();

	const { status, error, data, refetch } = useDetails(itemId);
	const [currentImage, setCurrentImage] = useState(0);

	const canEdit = userCanEdit(data);

	const loaded = status === 'success';
	const images = data?.images ?? [];
	const currentVersion = data?.versions[data?.versions.length - 1] || undefined;

	const backgroundColor = useItemColor(userData, data);

	if (status === 'error') {
		return <h1>{error.message} </h1>;
	}

	const handleNextImage = () => {
		setCurrentImage(jsModuloIsWeird(currentImage + 1, images.length));
	};

	const handlePrevImage = () => {
		setCurrentImage(jsModuloIsWeird(currentImage - 1, images.length));
	};

	return (
		<Box
			paddingLeft={['0px', '10%', '25%']}
			paddingRight={['0px', '10%', '25%']}
			height="1000px"
		>
			<Box background=/*'gray.900'*/ {backgroundColor} height="100%" p="8px">
				<Skeleton isLoaded={loaded} bg="teal">
					<Text textAlign="center" fontSize="6xl">
						{loaded ? data?.title : 'invalid item'}
					</Text>
				</Skeleton>

				<Skeleton isLoaded={loaded} mt="14px">
					<AspectRatio ratio={16 / 9}>
						<Image src={data?.images[currentImage]}></Image>
					</AspectRatio>
				</Skeleton>
				<Box mt="8px">
					<Button disabled={!loaded} onClick={handlePrevImage}>
						Prev
					</Button>
					<Button disabled={!loaded} marginLeft="8px" onClick={handleNextImage}>
						Next
					</Button>

					<PaymentButton itemId={itemId} price={data?.price} />

					{canEdit && (
						<ItemSettings
							itemId={itemId}
							disabled={data?.disabled}
							refetch={refetch}
						/>
					)}
				</Box>

				<Box mt="8px">
					<Flex>
						<Text>Pris:</Text>
						<Text fontWeight="bold" ml="8px">
							{currencyFormat(data?.price || 0)}
						</Text>
					</Flex>

					<Flex>
						<Text>Skabt af:</Text>
						<Text fontWeight="bold" ml="8px">
							{data?.author?.name ?? 'unknwon name'}
						</Text>
					</Flex>

					{currentVersion?.version && (
						<Flex>
							<Text>Version:</Text>
							<Text fontWeight="bold" ml="8px">
								{currentVersion.version}
							</Text>
						</Flex>
					)}

					{currentVersion?.createdAt && (
						<Flex>
							<Text>Sidste opdatering:</Text>
							<Text fontWeight="bold" ml="8px">
								{' '}
								{dayjs(currentVersion.createdAt).format('DD-MM-YY HH:mm')}{' '}
							</Text>
						</Flex>
					)}
				</Box>
			</Box>
		</Box>
	);
}
