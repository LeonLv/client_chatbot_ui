<script>
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { open } from "$lib/shared/stores/common/Store";
	import { Svroller } from "svrollbar";
	import TopNavigation from "$lib/modules/frame/TopNavigation.svelte";
	import SideNavigation from "$lib/modules/frame/SideNavigation.svelte";
	import Scrollbar from "$lib/shared/components/scrollbar/Scrollbar.svelte";

	onMount(() => {
		document.getElementsByTagName("body").item(0).removeAttribute("tabindex");
	});

	if (browser) {
		page.subscribe(() => {
			// close side navigation when route changes
			if (window.innerWidth > 768) {
				$open = true;
			}
		});
	}
</script>

<div class='h-screen overflow-hidden relative'>
	<div class="flex items-start">
		<SideNavigation />
		<div class='relative flex flex-col h-screen pl-0 w-full lg:pl-64 bg-white'>
			<TopNavigation />
			<Scrollbar className="h-0 grow mt-16 sm:mt-2" classLayout="h-full" alwaysVisible={false}>
				<slot />
			</Scrollbar>
		</div>
	</div>
</div>
