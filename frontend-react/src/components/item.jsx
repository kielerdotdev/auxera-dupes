import React from 'react';
import { Link } from 'react-router-dom';
import { Box, AspectRatio, Text, Skeleton } from '@chakra-ui/react';
import { HStack, Tag, Flex, Spacer, SkeletonText } from '@chakra-ui/react';
import Image from './image';
import { useUser } from '../context/user';
import { useItemColor, currencyFormat } from '../services/api';

export default function Item({ item, loading }) {
	const { user } = useUser();
	const poster_url = item?.images[0] ?? '';
	const backgroundColor = useItemColor(user, item);
	const itags = item?.type && item?.tags ? [item?.type, ...item?.tags] : [];

	return (
		<Box
			w={{
				base: '100%',
				sm: '28rem',
				md: 'calc((46rem - 1rem) / 2)',
				lg: 'calc((60rem - 2rem) / 3)',
			}}
			background={backgroundColor}
			rounded="lg"
			overflow="hidden"
			shadow="md"
		>
			<Link to={item?._id ? `/details/${item?._id}` : `/missingitemid`}>
				<Skeleton isLoaded={!loading}>
					<AspectRatio ratio={4 / 4}>
						<Image src={poster_url} alt={`Poster ${item?.title}`} />
					</AspectRatio>
				</Skeleton>

				<Box p="4">
					<Flex>
						<SkeletonText
							noOfLines={4}
							spacing="1"
							isLoaded={!loading}
							w="160px"
						>
							<Text as="h4" fontWeight="semibold" lineHeight="1" isTruncated>
								{item?.title ?? 'Lorem, ipsum dolor.'}
							</Text>

							<Text
								pt="8px"
								noOfLines={2}
								fontSize="sm"
								as="h4"
								fontWeight="light"
								lineHeight="1"
								isTruncated
							>
								{item?.description ?? 'Lorem, ipsum dolor.'}
							</Text>
						</SkeletonText>

						<Spacer />

						<Box float="right">
							<Skeleton float="right" isLoaded={!loading} w="110px">
								<Text
									as="h4"
									fontWeight="semibold"
									lineHeight="1"
									isTruncated
									textAlign="right"
								>
									{currencyFormat(item?.price ?? 0)}
								</Text>
							</Skeleton>

							<HStack spacing={1} float="right" pt="8px">
								{itags.map(tag => (
									<Tag size="sm" key={tag} variant="solid" colorScheme="teal">
										{tag}
									</Tag>
								))}
							</HStack>
						</Box>
					</Flex>
				</Box>
			</Link>
		</Box>
	);
}
