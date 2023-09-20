<script lang="ts">
	import MessageAvatar from "$lib/modules/chat/MessageAvatar.svelte";
	import MessageTimer from "$lib/modules/chat/MessageTimer.svelte";
	import { Avatar, Spinner } from "flowbite-svelte";
	import PictureEnlarge from "$lib/shared/components/images/PictureEnlarge.svelte";
	import Scrollbar from "$lib/shared/components/scrollbar/Scrollbar.svelte";
	import { MessageRole } from "$lib/shared/constant/Interface";
	import ChatAudio from "$lib/modules/chat/ChatAudio.svelte";
	import Assistant from "$lib/assets/chat/svelte/Assistant.svelte";
	import { fetchAudioText } from "$lib/network/chat/Network";
	import TranslateIcon from "$lib/assets/chat/svelte/TranslateIcon.svelte";

	export let type: MessageRole;
	export let message: any;
	export let time: string = "";
	export let initMsg: boolean = false;
	let imgPromise: Promise<any>;

	let isImage =
		Array.isArray(message) &&
		message.length == 1 &&
		typeof message[0] === "object";
	let isThumbnail =
		Array.isArray(message) &&
		message.length > 1 &&
		typeof message[0] === "object";
	let playIdx = 0;
	let autoPlay = message.length && message[message.length - 1] !== "done";
	let showTranslateText = false;

	function handlePlayEnded() {
		playIdx++;
		autoPlay = true;
		if (playIdx < message.length && message[playIdx] === "done") {
			playIdx = 0;
			autoPlay = false;
		}
	}

	async function translateToText(audio) {
		console.log(showTranslateText);

		if (showTranslateText == true) {
			showTranslateText = false;
			return;
		}

		imgPromise = (async () => {
			const blob = await fetch(audio).then((r) => r.blob());
			let response = await fetchAudioText(blob);
			return response.asr_result;
		})();

		showTranslateText = true;
	}
</script>

{#if time && !initMsg}
	<MessageTimer {time} />
{/if}

<div
	class="flex w-full gap-3"
	class:flex-row-reverse={type === MessageRole.User}
>
	<div
		class="flex aspect-square h-[30px] items-center justify-center rounded bg-[#0068B5] max-sm:hidden"
	>
		<MessageAvatar role={type} />
	</div>
	<div class="group relative">
		<div
			class={type === MessageRole.User
				? "wrap-style relative ml-4 rounded-l-lg rounded-br-lg border-2 border-[#3369FF] bg-[#3369FF] p-2 text-white"
				: "wrap-style relative mr-4 rounded-r-lg rounded-bl-lg  bg-blue-50 p-2 text-blue-800"}
		>
			{#if isThumbnail}
				<Scrollbar
					className="max-h-28 overflow-auto"
					classLayout="grid grid-cols-3 gap-4"
				>
					{#each message as image}
						<div class="relative">
							<PictureEnlarge
								imgSrc={image.imgSrc}
								enlargeClass={"w-3 h-3"}
								extraClass={"right-0 top-0"}
							/>
							<Avatar src={image.imgSrc} />
						</div>
					{/each}
				</Scrollbar>
			{:else if isImage}
				<div class="relative">
					<PictureEnlarge
						imgSrc={message[0].imgSrc}
						enlargeClass={"w-3 h-3"}
						extraClass={"right-0 top-0"}
					/>
					<img class="w-[30vw] sm:w-[10vw]" src={message[0].imgSrc} alt="" />
				</div>
			{:else if initMsg}
				<!-- <p class="text-sm">😀 Hi~</p> -->
				<p class="text-sm">
					Upload Your Images, Let’s
					<span class="">talking with them! 🎉</span>
				</p>
			{:else if Array.isArray(message)}
				{#key playIdx}
					<ChatAudio src={message[0]} {autoPlay} on:ended={handlePlayEnded} />
					{#if type === MessageRole.Assistant}
						<div class="absolute -top-5 right-0 hidden h-5 group-hover:flex">
							<button
								class="opacity-40"
								on:click={() => {
									translateToText(message[0]);
								}}
								class:opacity-100={showTranslateText}
							>
								<TranslateIcon />
							</button>
						</div>
						{#if showTranslateText}
							{#await imgPromise}
								<Spinner size={4} color="gray" />
							{:then translateText}
								<p class="whitespace-pre-line text-sm">{translateText}</p>
							{/await}
						{/if}
					{/if}
				{/key}
			{:else if message.includes("blob:")}
				<ChatAudio src={message} />
				{#if type === MessageRole.Assistant}
					<div class="absolute -top-5 right-0 hidden h-5 group-hover:flex">
						<button
							class="flex"
							on:click={() => {
								translateToText(message);
							}}
						>
							<TranslateIcon />
						</button>
					</div>
					{#if showTranslateText}
						{#await imgPromise}
							<Spinner size={4} color="gray" />
						{:then translateText}
							<p class="whitespace-pre-line text-sm">{translateText}</p>
						{/await}
					{/if}
				{/if}
			{:else}
				<p class="whitespace-pre-line text-sm">{message}</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.wrap-style {
		word-wrap: break-word;
		word-break: break-all;
	}
</style>
