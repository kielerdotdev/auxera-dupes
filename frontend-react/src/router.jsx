import React, { useEffect } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import IndexPage from './pages/index';
import AuthPage from './pages/auth';
import DetailsPage from './pages/details';
import CreateItemPage from './pages/createitem';
import CreateVersionPage from './pages/createversion';
import OrdersPage from './pages/orders';
import ProductsPage from './pages/products';
import UserPage from './pages/user';
import UsersPage from './pages/users';
import NotFoundPage from './pages/notfound';

import { useUser } from './context/user';

export default function Router({ children }) {
	const user = useUser();

	useEffect(() => {
		user.refresh();
	}, [user]);

	return (
		<>
			<BrowserRouter>
				{children}

				<Switch>
					<Route exact path="/" component={IndexPage} />
					<Route exact path="/auth" component={AuthPage} />
					<Route exact path="/details/:itemId" component={DetailsPage} />
					<Route exact path="/create" component={CreateItemPage} />
					<Route
						exact
						path="/createversion/:itemId"
						component={CreateVersionPage}
					/>
					<Route exact path="/orders" component={OrdersPage} />
					<Route exact path="/products" component={ProductsPage} />
					<Route exact path="/user/:userId" component={UserPage} />
					<Route exact path="/users" component={UsersPage} />
					<Route component={NotFoundPage} />
				</Switch>
			</BrowserRouter>
		</>
	);
}
