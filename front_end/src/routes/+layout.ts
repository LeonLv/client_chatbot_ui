import { env } from '$env/dynamic/public';
import { fetchImageList } from '$lib/network/image/Network';
import { imageList } from '$lib/shared/stores/common/Store';

/** @type {import('./$types').LayoutServerLoad} */
// export async function load({ fetch }) {
//   const url = `${env.BASE_URL}/getAllImages`
// 	const init: RequestInit = {
// 		method: "POST",
// 	}
//   let res;
// 	try {
// 		let response = await fetch(url, init);
// 		if (!response.ok) throw response.status
// 		res = await response.json();
// 	} catch (error) {
// 		console.error('network error: ', error);
// 		res = undefined
// 	}
//   if (res) {
//     imageList.set(res);
//   }
// }