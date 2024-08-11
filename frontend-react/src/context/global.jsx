import { QueryClient, QueryClientProvider } from 'react-query';
import { UserContext } from './user';
import { ToastContext } from './toast';
import { BrowserRouter } from 'react-router-dom'

const queryClient = new QueryClient();
const Providers = ({ children }) => {
	return (
		<BrowserRouter>
			<ToastContext>
				<UserContext>
					<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
				</UserContext>
			</ToastContext>
		</BrowserRouter>
	);
};
export default Providers;
