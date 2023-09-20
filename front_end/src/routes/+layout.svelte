<script>
	import "tailwindcss/tailwind.css";
	import Notifications from "svelte-notifications";
	import Layout from "$lib/modules/frame/Layout.svelte";
	import { onMount } from "svelte";
	import Timer from "$lib/modules/settings/Timer.svelte";
	import Marquee from "$lib/modules/layout/Marquee.svelte";


	onMount(() => {
		window.deviceType = window.innerWidth > 640 ? "pc" : "mobile";
		window.onresize = () => {
			window.deviceType = window.innerWidth > 640 ? "pc" : "mobile";
		};
	});


</script>

<Notifications>
	<Layout>
		<Marquee/>
		<Timer />
		<slot />
	</Layout>
</Notifications>
