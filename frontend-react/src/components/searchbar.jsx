import { useState, useEffect } from 'react';
import {
	Input,
	InputGroup,
	InputRightElement,
	Button,
	Stack,
} from '@chakra-ui/react';

export default function SearchBar({ onQuery }) {
	const [input, setInput] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => {
			onQuery(input);
		}, 1000);
		return () => clearTimeout(timer);
	}, [onQuery, input]);

	function onChange(event) {
		setInput(event.target.value);
	}

	function clearInput(event) {
		setInput('');
	}

	return (
		<>
			<InputGroup size="md" mt="1em">
				<Input
					value={input}
					placeholder="Søg..."
					variant="filled"
					onChange={onChange}
				/>
				<InputRightElement width="auto">
					<Stack spacing="4px" direction="row" mr="4px">
						<Button h="1.75rem" size="sm" onClick={clearInput}>
							Ryd
						</Button>
					</Stack>
				</InputRightElement>
			</InputGroup>
		</>
	);
}
