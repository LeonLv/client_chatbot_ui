import { env } from '$env/dynamic/public';
import { fetchMsg } from '$lib/network/image/Network';

const GETIMAGELIST_URL = env.GETIMAGELIST_URL;
const UPLOAD_IMAGE_URL = env.UPLOAD_IMAGE_URL;
const BASE_URL = env.BASE_URL;


async function chatMessage(data: any) {
	const url = `${GETIMAGELIST_URL}`
	

	const lastContentIndex = data.reduceRight((index, item, currentIndex) => {
		if (index === -1 && item.content !== undefined) {
			return currentIndex;
		}
		return index;
	}, -1);

	const secondLastContentIndex = data.reduceRight((index, item, currentIndex) => {
		if (index === -1 && item.content !== undefined && currentIndex !== lastContentIndex) {
			return currentIndex;
		}
		return index;
	}, -1);

	if (lastContentIndex !== -1) {
		const imageListBetween = data.slice(secondLastContentIndex + 1, lastContentIndex)
			.reduce((acc, item) => {
				if (item.ImageList !== undefined) {
					return acc.concat(item.ImageList);
				}
				return acc;
			}, []);
		
		if (imageListBetween.length === 0) {
			let result = {
				query: data[lastContentIndex].content
			}
			return fetchMsg('/chatWithImage', result)
		} else {
			let result = {
				query: data[lastContentIndex].content,
				ImageList: imageListBetween,
			};
			return fetchMsg('/image2Image', result)
		}
		

	} else {
		console.log("error");
	}
}


async function UploadImage(data: any) {
	const url = `${UPLOAD_IMAGE_URL}`
}



export default { chatMessage };
