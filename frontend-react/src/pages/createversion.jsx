import { useState, useEffect, useRef } from 'react';
import {
	Box,
	Stack,
	Button,
	Text,
	Input,
	FormLabel,
	FormControl,
	FormErrorMessage,
	Textarea,
	Checkbox,
	Popover,
	PopoverBody,
	PopoverTrigger,
	PopoverContent,
	PopoverArrow,
	PopoverCloseButton,
	ButtonGroup,
	PopoverFooter,
	PopoverHeader,
	IconButton,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { useDropzone } from 'react-dropzone';
import styled from '@emotion/styled';
import { useForm, Controller } from 'react-hook-form';
import { engine, useDetails } from '../services/api';
import { useUser } from '../context/user';
import { useHistory } from 'react-router-dom';
import { useMutation } from 'react-query';

const getColor = props => {
	if (props.isDragAccept) {
		return '#00e676';
	}
	if (props.isDragReject) {
		return '#ff1744';
	}
	if (props.isDragActive) {
		return '#2196f3';
	}
	return '#eeeeee';
};

const Container = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px;
	border-width: 2px;
	border-radius: 2px;
	border-color: ${props => getColor(props)};
	border-style: dashed;
	background-color: #101010;
	color: #ffffff;
	outline: none;
	transition: border 0.24s ease-in-out;
`;

function StyledDropzone(props) {
	const {
		getRootProps,
		getInputProps,

		isDragActive,
		isDragAccept,
		isDragReject,
	} = useDropzone({
		accept: props.accept,
		onDrop: props.onDrop,
		multiple: props.multiple,
		maxSize: props.maxSize,
		maxFiles: props.maxFiles,
		paramName: () => {
			return 'files';
		},
	});

	return (
		<div className="container">
			<Container
				{...getRootProps({ isDragActive, isDragAccept, isDragReject })}
			>
				<input {...getInputProps()} />
				<p>{props.name}</p>
			</Container>
		</div>
	);
}

function FileZone({ onChange, name }) {
	const [file, setFile] = useState();

	useEffect(() => {
		onChange(file);
	}, [onChange, file]);

	const onDrop = ([file]) => {
		setFile(file);
	};

	return (
		<StyledDropzone
			accept="text/plain"
			onDrop={onDrop}
			name={file?.name ?? name}
			multiple={false}
			maxSize={1000000}
			maxFiles={1}
		></StyledDropzone>
	);
}

function SecurityInformation() {
	const initialFocusRef = useRef();
	const [page, setPage] = useState(1);

	return (
		<Popover
			initialFocusRef={initialFocusRef}
			placement="bottom"
			closeOnBlur={false}
		>
			<PopoverTrigger>
				<IconButton icon={<InfoIcon />} size="sm" />
			</PopoverTrigger>
			<PopoverContent color="white" bg="blue.800" borderColor="blue.800">
				<PopoverHeader pt={4} fontWeight="bold" border="0">
					E2 HTTP Security
				</PopoverHeader>
				<PopoverArrow />
				<PopoverCloseButton />
				<PopoverBody>
					{page === 1 && (
						<>
							<h1>
								Dette er en API, som dine E2er kan tilspørge, for at tjekke om
								spilleren der bruger dem, har tilladelse til det.
							</h1>

							<h1>Du skal selv implementere E2 delen.</h1>
						</>
					)}
					{page === 2 && (
						<>
							<h1>Eksempel Kode.</h1>
						</>
					)}
				</PopoverBody>
				<PopoverFooter
					border="0"
					d="flex"
					alignItems="center"
					justifyContent="space-between"
					pb={4}
				>
					<Box fontSize="sm">{page} af 2</Box>
					<ButtonGroup size="sm">
						<Button
							onClick={() => {
								setPage(page === 1 ? 2 : 1);
							}}
							colorScheme="blue"
							ref={initialFocusRef}
						>
							{page === 1 ? 'Næste' : 'Tilbage'}
						</Button>
					</ButtonGroup>
				</PopoverFooter>
			</PopoverContent>
		</Popover>
	);
}

export default function CreateVersionPage({ match }) {
	const itemId = match.params.itemId;

	const { canEdit } = useUser();
	const { status, error, data } = useDetails(itemId);

	const { mutate } = useMutation(async bodyData => {
		const { data } = await engine({
			method: 'post',
			url: `/items/${itemId}/versions`,
			headers: {},
			data: bodyData,
		});

		return data;
	});

	const {
		register,
		handleSubmit,
		errors,
		control,
		formState,
		watch,
	} = useForm();
	//const formValues = getValues()
	const history = useHistory();

	const loaded = status === 'success';
	if (status === 'error') {
		return <h1>{error.message} </h1>;
	}

	if (loaded && !canEdit(data)) {
		return <h1>You cannot edit</h1>;
	}

	if (!loaded) {
		return <h1>loading.</h1>;
	}

	//TODO: Check if client is author of item

	const onSubmit = async e => {
		console.log('data', e);

		try {
			const bodyData = {};
			bodyData.obfuscate = e.obfuscate;
			bodyData.security = e.security;

			if (e.security) {
				bodyData.securityData = e.securityData;
			}

			bodyData.version = e.version;
			bodyData.data = await new Promise((resolve, reject) => {
				const reader = new FileReader();

				reader.onload = function (e) {
					resolve(e.target.result);
				};

				reader.onerror = reject;

				reader.readAsDataURL(e.file);
			});

			mutate(bodyData, {
				onSuccess: itemId => {
					history.push(`/details/${itemId}/`);
				},
			});
		} catch (err) {
			console.log(err);
		}
	};

	const onError = async e => {
		console.log(e, errors);
	};

	const ShowError = ({ type }) => {
		return errors[type] ? (
			<FormErrorMessage>{errors[type].message}</FormErrorMessage>
		) : null;
	};

	const security = watch('security', false);

	return (
		<form onSubmit={handleSubmit(onSubmit, onError)}>
			<Box
				paddingLeft={['0px', '10%', '25%']}
				paddingRight={['0px', '10%', '25%']}
			>
				<Box bgColor="gray.900" height="100%" p="16px">
					<Text textAlign="center" fontSize="6xl">
						Opret Version
					</Text>
					<Stack spacing="12px">
						<FormControl isInvalid={errors.version}>
							<FormLabel>Produkt Version</FormLabel>
							<Input
								name="version"
								variant="filled"
								defaultValue="1.0.0"
								ref={register({
									required: 'error.fuckyou',
									rules: {
										maxLength: input =>
											input?.length > 20
												? 'Version can only be 20 characters long'
												: true,
									},
								})}
							></Input>
							<ShowError type="version" />
						</FormControl>

						<FormControl isInvalid={errors.file}>
							<FormLabel>Fil</FormLabel>
							<Controller
								name="file"
								control={control}
								defaultValue={''}
								render={({ onChange }) => {
									return (
										<FileZone
											onChange={onChange}
											name="Smid din fukcing dupe, eller e2 her."
										/>
									);
								}}
								rules={{
									required: 'Upload fil.',
								}}
							/>
							<ShowError type="file" />
						</FormControl>

						{loaded && data.type === 'e2' && (
							<FormControl>
								<FormLabel>Sikkerhed</FormLabel>
								<Stack>
									<Checkbox
										name="obfuscate"
										variant="filled"
										defaultValue="1.0.0"
										ref={register()}
									>
										Obfusker Kode
									</Checkbox>
									<Checkbox
										name="security"
										variant="filled"
										defaultValue="1.0.0"
										ref={register()}
									>
										HTTP Sikring {<SecurityInformation />}
									</Checkbox>

									{security && (
										<FormControl isInvalid={errors.description}>
											<FormLabel>HTTP Data</FormLabel>
											<Textarea
												name="securityData"
												placeholder="HTTP Data"
												variant="filled"
												ref={register({
													required:
														'Du kan ikke oprette HTTP Sikring uden data som bliver returneres når brugeren er bekræftet.',
												})}
											></Textarea>
											<ShowError type="securityData" />
										</FormControl>
									)}
								</Stack>
							</FormControl>
						)}

						<Button
							type="submit"
							isLoading={formState.isSubmitting}
							width="100%"
						>
							Opret
						</Button>
					</Stack>
				</Box>
			</Box>
		</form>
	);
}
