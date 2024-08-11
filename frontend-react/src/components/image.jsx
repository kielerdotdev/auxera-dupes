import { Image, Skeleton } from '@chakra-ui/react';

export default function AuxeraImage({
	src,
	alt = '',
	placeholder = <Skeleton />,
}) {
	if (src && !src.includes('http')) {
		src = `${window.location.origin}/images/${src}`;
	}

	return <Image src={src} alt={alt} fallback={placeholder} />;
}
