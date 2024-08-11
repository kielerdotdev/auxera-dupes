// src/pages/index.js
import { useState, useEffect } from 'react';
import {
	Box,
	Stack,
	Button,
	Text,
	AspectRatio,
	Input,
	FormLabel,
	FormControl,
	FormErrorMessage,
	NumberInput,
	NumberInputField,
	Textarea,
	Select,
} from '@chakra-ui/react';
import ReactSelect from '../components/select';
import { useDropzone } from 'react-dropzone';
import styled from '@emotion/styled';
import { useForm, Controller } from 'react-hook-form';
import { engine } from '../services/api';
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

function ImageZone({ onChange, name }) {
	const [imagesData, setImagesData] = useState([]);

	useEffect(() => {
		onChange(imagesData.map(data => data.file));
	}, [onChange, imagesData]);

	const onDrop = files => {
		setImagesData([
			...imagesData,
			...files.map(file => {
				return {
					src: URL.createObjectURL(file),
					file,
				};
			}),
		]);
	};

	const removeImage = id => {
		setImagesData(imagesData.filter((_, index) => index !== id));
	};

	return (
		<>
			<StyledDropzone
				accept="image/jpeg,image/png,image/gif"
				onDrop={onDrop}
				name={name}
				multiple={true}
				maxSize={15000000 /* 15mb max size in bytes */}
				maxFiles={15}
			></StyledDropzone>
			{imagesData.map((data, i) => (
				<Box key={i} pt="24px">
					<Stack spacing="0px">
						<AspectRatio ratio={16 / 9}>
							<img src={data.src} alt="Produkt billede"></img>
						</AspectRatio>
						<Button size="xs" onClick={() => removeImage(i)}>
							Billede {i + 1} - Tryk her for at fjerne
						</Button>
					</Stack>
				</Box>
			))}
		</>
	);
}

//TODO: Better handling of tags https://downshift.netlify.app/use-combobox
const tags = ['bank', 'politi', 'gunshop', 'homeless'].map(tag => {
	return { value: tag, label: tag };
});

function TagsSelection({ onChange }) {
	const [selectedItems, setSelectedItems] = useState();

	useEffect(() => {
		onChange(selectedItems);
	}, [onChange, selectedItems]);

	return (
		<ReactSelect
			defaultValue={selectedItems}
			onChange={setSelectedItems}
			closeMenuOnSelect={false}
			isMulti
			options={tags}
		/>
	);
}

export default function CreateItemPage() {
	const { register, handleSubmit, errors, control, formState } = useForm();
	const history = useHistory();

	const { mutate } = useMutation(async bodyData => {
		const { data } = await engine({
			method: 'post',
			url: '/items',
			headers: {},
			data: bodyData,
		});

		return data;
	});

	const onSubmit = async e => {
		console.log('data', e);

		try {
			const bodyData = {};
			bodyData.type = e.type;
			bodyData.title = e.title;
			bodyData.price = e.price;
			bodyData.description = e.description;
			bodyData.tags = e.tags?.map(({ label }) => label);

			bodyData.images = await Promise.all(
				e.images.map(file => {
					return new Promise((resolve, reject) => {
						const reader = new FileReader();

						reader.onload = function (e) {
							resolve(e.target.result);
						};

						reader.onerror = reject;

						reader.readAsDataURL(file);
					});
				})
			);

			console.log(bodyData);

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

	return (
		<form onSubmit={handleSubmit(onSubmit, onError)}>
			<Box
				paddingLeft={['0px', '10%', '25%']}
				paddingRight={['0px', '10%', '25%']}
			>
				<Box bgColor="gray.900" height="100%" p="16px">
					<Text textAlign="center" fontSize="6xl">
						Opret Produkt
					</Text>
					<Stack spacing="12px">
						<Stack spacing="8px" direction="row">
							<FormControl isInvalid={errors.title}>
								<FormLabel>Navn</FormLabel>
								<Input
									name="title"
									variant="filled"
									ref={register({
										required: 'Produktnavn er påkrævet!',
									})}
								></Input>
								<ShowError type="title" />
							</FormControl>

							<FormControl isInvalid={errors.price}>
								<FormLabel>Pris</FormLabel>
								<Controller
									name="price"
									control={control}
									defaultValue={'10000'}
									render={({ onChange, value }) => (
										<NumberInput
											variant="filled"
											value={value}
											onChange={value => {
												const integer = parseInt(value);

												if (!integer) {
													onChange('');
													return;
												}

												const clamped = Math.min(
													Math.max(integer, 0),
													100000000
												);

												onChange(clamped);
											}}
										>
											<NumberInputField />
										</NumberInput>
									)}
									rules={{
										required: 'Euhmm, giver du dit pis gratis ud? lol',
										validate: {
											minimumPrice: input =>
												parseInt(input, 10) < 10000
													? 'Prisen er for billig! Minimum 10000kr!'
													: true,
											divisible: input =>
												input % 10000 !== 0
													? 'Prisen skal være et nummer, der kan deles med 10000.'
													: true,
										},
									}}
								/>
								<ShowError type="price" />
							</FormControl>
						</Stack>

						<FormControl isInvalid={errors.type}>
							<FormLabel>Type</FormLabel>
							<Select
								name="type"
								variant="filled"
								placeholder="Vælg type"
								ref={register({
									required: 'Type er påkrævet!',
								})}
							>
								<option value="e2">E2</option>
								<option value="dupe">Dupe</option>
							</Select>

							<ShowError type="type" />
						</FormControl>

						<FormControl isInvalid={errors.description}>
							<FormLabel>Beskrivelse</FormLabel>
							<Textarea
								name="description"
								placeholder="Beskrivelse"
								variant="filled"
								ref={register({
									required:
										'Beskrivelse er påkrævet!',
								})}
							></Textarea>
							<ShowError type="description" />
						</FormControl>

						<FormControl isInvalid={errors.tags}>
							<FormLabel>Tags</FormLabel>
							<Controller
								name="tags"
								control={control}
								defaultValue={[]}
								render={({ onChange }) => <TagsSelection onChange={onChange} />}
							/>
							<ShowError type="tags" />
						</FormControl>

						<FormControl isInvalid={errors.images}>
							<FormLabel>Billeder</FormLabel>

							<Controller
								name="images"
								control={control}
								defaultValue={[]}
								render={({ onChange }) => {
									return (
										<ImageZone
											onChange={onChange}
											name="Smid nu billeder ind."
										/>
									);
								}}
								rules={{
									required: 'Billeder er påkrævet!',
									validate: {
										doesThisShitEvenHaveAnyImages: images =>
											images.length === 0
												? 'Billederne er påkrævet!'
												: true,
										maximumAmount: images =>
											images.length > 15
												? 'Maks 15 billeder!'
												: true,
									},
								}}
							/>
							<ShowError type="images" />
						</FormControl>

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
