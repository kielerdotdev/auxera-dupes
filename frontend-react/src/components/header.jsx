import {
	Box,
	Flex,
	Menu,
	MenuList,
	MenuItem,
	MenuButton,
} from '@chakra-ui/react';
import { Link, useHistory } from 'react-router-dom';
import { useUser } from '../context/user';

const Header = props => {
	const user = useUser();

	const history = useHistory();

	return (
		<Box background={'gray.700'} overflow="hidden" shadow="md">
			<Flex
				as="nav"
				align="center"
				justify="space-between"
				wrap="wrap"
				w="100%"
				color={['white', 'white']}
				margin="8px"
				paddingRight="16px"
				height="32px"
				{...props}
			>
				<Flex align="left">
					<Link to="/">Auxera E2 & Dupes</Link>
				</Flex>
				<Flex align="right">
					<Menu>
						<MenuButton
							onClick={() => {
								if (!user.loggedIn) {
									user.redirectToAuth(true);
								}
							}}
						>
							{user.loggedIn ? 'Min konto' : 'Log ind'}
						</MenuButton>
						{user.loggedIn && (
							<MenuList>
								<MenuItem>
									<Link to="/owned">Købte Produkter</Link>
								</MenuItem>

								{user.isAuthor && (
									<MenuItem>
										<Link to="/create">Opret nyt produkt</Link>
									</MenuItem>
								)}

								{user.isAuthor && (
									<MenuItem>
										<Link to="/products">Mine produkter</Link>
									</MenuItem>
								)}

								<MenuItem
									onClick={() => {
										user.logout();
									}}
								>
									Log ud
								</MenuItem>
							</MenuList>
						)}
					</Menu>
				</Flex>
			</Flex>
		</Box>
	);
};

export default Header;
