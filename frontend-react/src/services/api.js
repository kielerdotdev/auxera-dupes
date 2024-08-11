import { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import {makeToast} from '../context/toast'

export const BASE_URL =
	process.env.GATSBY_API_URL ||
	(typeof window !== 'undefined' && `${window.location.origin}/api`) ||
	'noapuis';
export const AUTH_URL = `${BASE_URL}/auth`;

export const engine = axios.create({
	withCredentials: true,
	baseURL: BASE_URL,
});
engine.interceptors.response.use(
	function (response) {
		return response;
	},
	function (err) {
		if(err?.response) {
			const errData = err?.response?.data

			// lets hide missing missing refresh cookie messages, because we're clearly not logged in then.
			const url = err?.response?.config?.url ?? ''
			const ignoreWarnings = [
				'/auth/refresh',
			]
			if(!ignoreWarnings.includes(url)) {
				// this type is not ignored, display it to the user.

				makeToast({
					title: errData?.title ?? err?.message ?? 'invalid error title',
					description: errData?.detail || 'invalid error detail',
					status: 'warning',
					duration: 9000,
					isClosable: true,
					position: 'bottom-left'
				});
			}


		}

		return Promise.reject(err.response);
	}
);

export function useHomeScreen(query = '', enabled = false) {
	return useQuery(
		['home_screen', query],
		async () => {
			const { data } = await engine.get(`/items?query=${query}`);
			return data;
		},
		{
			enabled: enabled,
		}
	);
}

export function useDetails(id) {
	return useQuery(`details/${id}`, async () => {
		const { data } = await engine.get(`/items/${id}`);
		return data;
	});
}

export function useYourItems() {
	return useQuery(['youritems'], async () => {
		const { data } = await engine.get(`/items/me`);
		return data;
	});
}

export function useItemColor(user, item, fallback = 'gray.700') {
	const [color, setColor] = useState(fallback);

	useEffect(() => {
		try {
			const isAuthor = user._id === item.author._id;
			let backgroundColor = isAuthor ? 'gray.600' : 'gray.700';

			const isDisabled = item?.disabled !== undefined;

			if (isDisabled) {
				if (item.disabled.type === 'forced') {
					backgroundColor = isAuthor ? 'red.500' : 'red.600';
				} else {
					backgroundColor = isAuthor ? 'purple.600' : 'purple.700';
				}
			}

			setColor(backgroundColor);
		} catch {}
	}, [user, item]);

	return color;
}

export function useLatestItemVersion(item) {
	return item?.versions?.reduce((current, version) => {
		if (!current) {
			return version;
		}

		return version.createdAt > current.createdAt ? version : current;
	}, null);
}

export function usePaymentStatus(id, interval = null, loaded = false) {
	return useQuery(
		['payment', id],
		async () => {
			const { data } = await engine.get(`/payment/${id}/status`);
			return data;
		},
		{
			refetchInterval: interval,
			cacheTime: 0,
			enabled: loaded,
		}
	);
}

export const { format: currencyFormat } = new Intl.NumberFormat('da-DK', {
	style: 'currency',
	currency: 'DKK',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});
