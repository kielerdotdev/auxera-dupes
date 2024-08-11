import { useState, useContext, createContext } from 'react';
import { engine, AUTH_URL } from '../services/api';
import jwtDecode from 'jwt-decode';

const Context = createContext();
export function UserContext(props) {
	const defaultUser = {
		name: '',
		roles: [],
		id: '',
	};
	const defaultAuth = {
		expire: Date.now(),
		accessToken: '',
	};

	const [nextRefresh, setNextRefresh] = useState(Date.now() - 5000);
	const [auth, setAuth] = useState(defaultAuth);
	const [user, setUser] = useState(defaultUser);
	const [ready, setReady] = useState(false);
	const isAdmin = user.roles.includes('admin');
	const isAuthor = user.roles.includes('author');

	const logout = async () => {
		await engine.delete('/auth/logout');

		engine.defaults.headers['Authorization'] = null;
		setUser(defaultUser);
		setAuth(defaultAuth);
	};

	const setAccessToken = async token => {
		const decoded = jwtDecode(token);
		if (!decoded) {
			throw new Error('invalid refreshToken jwt');
		}

		setUser({
			name: decoded.name,
			roles: decoded.roles,
			_id: decoded.userId,
		});

		const expire = decoded.exp * 1000;
		setAuth({
			expire: expire,
			accessToken: token,
		});

		engine.defaults.headers['Authorization'] = `Bearer ${token}`;
		setNextRefresh(expire);
		setReady(true);

		setTimeout(refresh, expire - Date.now())
	};

	const redirectToAuth = async (redirectBack = false) => {
		sessionStorage.setItem('redirectAuth', window.location.href);
		if (!redirectBack) {
			sessionStorage.removeItem('redirectAuth');
		}

		window.location.href = AUTH_URL;
	};

	const refresh = async () => {
		// we have already tried to login, and failed. dont retry
		if (nextRefresh === null) {
			return;
		}

		// we have a valid jwt, dont refresh
		if (Date.now() < nextRefresh) {
			return;
		}

		console.log('refresh...')

		// disable refresh for now, if successfull in refreshing token, we can refresh after it expired.
		setNextRefresh(null); // dont retry to refresh.

		try {
			var response = await engine.get('/auth/refresh');
		} catch (err) {}

		if (!response || response.status !== 200) {
			setReady(true);
			return;
		}

		await setAccessToken(response.data);
	};

	// user functions...
	function canEdit(item) {
		console.log(item, user)

		if (!item) {
			return false;
		}

		if (item?.author._id === user?._id) {
			return true;
		}

		if (isAdmin) {
			return true;
		}

		return false;
	}

	return (
		<Context.Provider
			value={{
				user,
				setAccessToken,
				canEdit,
				isAdmin,
				isAuthor,
				loggedIn: auth.expire > Date.now(),
				logout,
				ready,
				refresh,
				redirectToAuth,
			}}
		>
			{props.children}
		</Context.Provider>
	);
}

export function useUser() {
	const context = useContext(Context);
	//context.refresh()

	return context;
}
