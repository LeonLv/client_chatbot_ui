<script lang="ts">
	import { Alert } from "flowbite-svelte";
	import { trafficHint } from "$lib/shared/Utils";
	import { onMount } from "svelte";
  
	let content = '';
  
	const interval = 5000;
  
	const updateContent = async () => {  
	  const result = await trafficHint();
	  if (result && result > 20) {
		content = result + ` people ahead of you. Please wait a moment!`; 
	  }
  
	  setTimeout(updateContent, interval);
	};
  
	onMount(() => {
	  setTimeout(updateContent, interval);
	});
  </script>
  
  {#if content != ''}
	<Alert color="yellow">
	  {content}
	</Alert>
  {/if}
  