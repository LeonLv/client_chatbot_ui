<script lang="ts">
	export let data;
	import ChatMessage from "$lib/modules/chat/ChatMessage.svelte";
	import PaperAirplane from "$lib/assets/chat/svelte/PaperAirplane.svelte";
	import HintIcon from "$lib/assets/chat/svelte/HintIcon.svelte";
	import ImageIcon from "$lib/assets/chat/svelte/ImageIcon.svelte";

	import DropZone from "$lib/shared/components/drag-drop/DropZone.svelte";
	import ChatResponse from "$lib/network/chat/ChatResponse";
	import LoadingButtonSpinnerIcon from "$lib/assets/chat/svelte/LoadingButtonSpinnerIcon.svelte";
	import {
		ifStoreMsg,
		imageList,
		isLoading,
	} from "$lib/shared/stores/common/Store";
	import { Badge, Progressbar } from "flowbite-svelte";
	import { onMount } from "svelte";
	import { fetchImageList } from "$lib/network/image/Network";
	import Scrollbar from "$lib/shared/components/scrollbar/Scrollbar.svelte";
	import {
		LOCAL_STORAGE_KEY,
		MessageRole,
	} from "$lib/shared/constant/Interface";
	import {
		fromTimeStampToTime,
		getCurrentTimeStamp,
		scrollToBottom,
	} from "$lib/shared/Utils";
	import ChatImageCard from "$lib/modules/chat/ChatImageCard.svelte";
	import ArrowRight from "$lib/assets/chat/svelte/ArrowRight.svelte";
	import { fetchAudioStream, fetchAudioText } from "$lib/network/chat/Network";
	import VoiceButton from "$lib/shared/components/talkbot/VoiceButton.svelte";
	import { browser } from "$app/environment";
	// import BadgesRow from "$lib/modules/chat/BadgesRow.svelte";

	let query: string = "";

	let loading: boolean = false;
	let scrollToDiv: HTMLDivElement;
	let contentQuery: string = "";

	let uploadProgress = 0;
	let uploadHandle: number;

	let showBottomImages = false;
	let showBottomPrompt = false;
	let chatMessages: any[] = data.chatMsg ? data.chatMsg : [];

	$: placeholder = (chatMessages.length && chatMessages[chatMessages.length - 1].role === MessageRole.User
						&& !chatMessages[chatMessages.length - 1].ImageList ? 
						"Upload more images/Ask me about..." : "Upload images/Ask me about...");
	$: currentDragImageList = new Array($imageList.length).fill(false);

	// $: badges =
	// 	$imageList.length === 0
	// 		? []
	// 		: chatMessages.length && !chatMessages[chatMessages.length - 1].content
	// 		? ["Convert to Van Gogh Style", "Convert to Oil Painting Style"]
	// 		: [
	// 				"Give me photos taken on April 28, 2023",
	// 				"Give me photos taken in Shanghai",
	// 		  ];
	const prompts = {
		'Image Style': ['oil paiting', 'van gogh'],
		Time: ['2022, March 6th', 'April 28, 2023'],
		Location: ['Shanghai', 'China', 'United States'],
	};
	const fullPromptMap = (word: string) => ({
		'Image Style': `Covert to ${word} Style`,
		Time: `Give me photos taken on ${word}`,
		Location: `Give me photos taken in ${word}`,
	} as {[index: string]: string})

	onMount(async () => {
		const res = await fetchImageList();
		imageList.set(res);
		scrollToDiv = document
			.querySelector(".chat-scrollbar")
			?.querySelector(".svlr-viewport")!;

		// todo
		const handle = setInterval(() => {
			if ($ifStoreMsg && browser) {
				localStorage.setItem(
					LOCAL_STORAGE_KEY.STORAGE_CHAT_KEY,
					JSON.stringify(chatMessages)
				);
			}
		}, 10000)

		return () => clearInterval(handle)
	});

	function handleImageDrop(e: CustomEvent) {
		scrollToBottom(scrollToDiv);
		const newMessage = {
			role: MessageRole.User,
			content: undefined,
			ImageList: [{ imgId: e.detail.id, imgSrc: e.detail.src }],
			time: getCurrentTimeStamp(),
		};
		chatMessages = [...chatMessages, newMessage];
	}

	const handleSubmit = async (enableRegenerate: boolean): Promise<void> => {
		loading = true;
		contentQuery = query;
		query = "";

		if (enableRegenerate) {
			let lastRole = chatMessages[chatMessages.length - 1];
			if (lastRole?.role === MessageRole.Assistant) {
				chatMessages = chatMessages.filter(
					(_, i: number) => i !== chatMessages.length - 1
				);
				contentQuery = chatMessages[chatMessages.length - 1].content;
			}
		} else {
			const newMessage = {
				role: MessageRole.User,
				content: contentQuery,
				ImageList: undefined,
				time: getCurrentTimeStamp(),
			};

			chatMessages = [...chatMessages, newMessage];
		}
		scrollToBottom(scrollToDiv);

		const res = await ChatResponse.chatMessage(chatMessages);

		if (res) {
			loading = false;
			const response = res;
			chatMessages = [
				...chatMessages,
				{
					role: MessageRole.Assistant,
					content: response,
					time: getCurrentTimeStamp(),
				},
			];
		} else {
			handleError;
		}

		console.log(chatMessages);

		query = "";
	};

	function handleError<T>(err: T) {
		loading = false;
		query = "";
	}

	function handleUploadBegin() {
		uploadHandle = setInterval(() => {
			if (uploadProgress < 70) uploadProgress += 5;
			else if (uploadProgress < 90) uploadProgress += 2;
			else if (uploadProgress < 99) uploadProgress += 1;
		}, 500);
	}

	function handleUploadEnd() {
		uploadProgress = 0;
		clearInterval(uploadHandle);
	}

	function uploadImagesToChat() {
		const checkedItems = $imageList.filter((_, i) => currentDragImageList[i]);

		const newMessage = {
			role: MessageRole.User,
			content: undefined,
			ImageList: checkedItems.map((image) => ({
				imgSrc: image.image_path,
				imgId: image.image_id,
			})),
			time: getCurrentTimeStamp(),
		};

		chatMessages = [...chatMessages, newMessage];
		console.log(chatMessages);
	}

	const handleSubmitTalking = async (
		enableRegenerate = false
	): Promise<void> => {
		scrollToBottom(scrollToDiv);
		loading = true;
		if (enableRegenerate) {
			let lastRole = chatMessages[chatMessages.length - 1];
			if (lastRole.role === MessageRole.Assistant) {
				chatMessages = chatMessages.filter(
					(_, i: number) => i !== chatMessages.length - 1
				);
			}
		}
		const content = chatMessages[chatMessages.length - 1].content as string;

		const blob = await fetch(content).then((r) => r.blob());
		const voice = "default";
		const knowledge = "default";

		const res = await fetchAudioText(blob);
		const eventSource = await fetchAudioStream(
			res.asr_result,
			voice,
			knowledge
		);

		eventSource.addEventListener("message", (e) => {
			loading = false;
			let currentMsg = e.data;
			if (currentMsg.startsWith("b'")) {
				const audioUrl = "data:audio/wav;base64," + currentMsg.slice(2, -1);

				if (chatMessages[chatMessages.length - 1].role == MessageRole.User) {
					chatMessages = [
						...chatMessages,
						{ role: MessageRole.Assistant, content: [audioUrl, ] },
					];
				} else {
					let content = chatMessages[chatMessages.length - 1].content;
					chatMessages[chatMessages.length - 1].content = [
						...content,
						audioUrl,
					];
				}

				scrollToBottom(scrollToDiv);
				
			} else if (currentMsg === "[DONE]") {
				let content = chatMessages[chatMessages.length - 1].content;
				chatMessages[chatMessages.length - 1].content = [...content, "done"];
			}
		});
		eventSource.stream();
	};
</script>

<DropZone on:drop={handleImageDrop}>
	<div class="h-full items-center gap-5 sm:flex sm:px-20 sm:pb-2">
		<div class="mx-auto flex h-full w-full flex-col sm:mt-0 sm:w-2/3">
			<Scrollbar
				classLayout="flex flex-col gap-1"
				className="chat-scrollbar h-0 w-full grow px-2 pt-2 max-sm:mt-3"
			>
				<ChatMessage
					type={MessageRole.Assistant}
					initMsg={true}
					message={``}
					time={fromTimeStampToTime(getCurrentTimeStamp())}
				/>
				{#each chatMessages as message, i}
					{#if message.content}
						<ChatMessage
							type={message.role}
							message={message.content}
							time={i === 0 || (message[i - 1] && message.time - message[i - 1]?.time > 60)
								? message.time ? fromTimeStampToTime(message.time.toString()) : ""
								: ""}
						/>
					{:else}
						<ChatMessage
							type={message.role}
							message={message.ImageList}
							time={i === 0 || message.time - message[i - 1]?.time > 60
								? message.time
									? fromTimeStampToTime(message.time.toString())
									: ""
								: ""}
						/>
					{/if}
				{/each}
			</Scrollbar>
			<!-- Loading text -->
			{#if loading}
				<div
					class="mb-6 flex items-center justify-center self-center bg-white text-sm text-gray-500"
				>
					<div class="inset-y-0 left-0 pl-2">
						<LoadingButtonSpinnerIcon />
					</div>

					<div>Generating...</div>
				</div>
			{/if}

			{#if $isLoading}
				<span class="mb-4 ml-4 text-sm text-gray-500"
					>Uploading, please wait...</span
				>
			{/if}

			<div
				class="relative flex w-full flex-col items-center justify-between bg-white px-4 py-2 shadow-inner"
			>
				{#if uploadProgress}
					<Progressbar
						progress={uploadProgress.toString()}
						size="h-1"
						color="blue"
					/>
				{/if}
				<div class="flex w-full flex-row items-center justify-between gap-3">
						<VoiceButton
							bind:chatMessages
							on:done={() => {
								handleSubmitTalking();
							}}
						/>
					<!-- Textarea -->
					<div
						class="relative focus:ring-link flex max-h-60 w-full flex-row items-center rounded-lg border border-gray-300 p-1 focus:border-transparent focus:outline-none focus:ring-1"
					>
						<textarea
							rows="2"
							class="focus:none inline-block w-full resize-none border-none text-sm text-gray-600 focus:ring-0 p-0 px-2"
							{placeholder}
							disabled={loading}
							maxlength="1200"
							bind:value={query}
							on:keydown={(event) => {
								if (event.key === "Enter" && !event.shiftKey && query) {
									event.preventDefault();
									handleSubmit(false);
								}
							}}
						/>
						<button
							class="absolute right-1 bottom-1"
							on:click={() => {
								if (query) {
									handleSubmit(false);
								}
							}}
							type="submit"
						>
							<PaperAirplane />
						</button>
					</div>
					<button
						on:click={() => {
							showBottomPrompt = !showBottomPrompt;
							showBottomImages = false;
						}}
					>
						<HintIcon extraClass={showBottomPrompt ? "hidden" : ""} />
						<ArrowRight
							extraClass={`${
								!showBottomPrompt ? "hidden" : ""
							} w-5 h-5 rotate-90`}
						/>
					</button>
					<button
						class="h-full sm:hidden"
						on:click={() => {
							showBottomImages = !showBottomImages;
							showBottomPrompt = false;
						}}
					>
						<ImageIcon extraClass={showBottomImages ? "hidden" : ""} />
						<ArrowRight
							extraClass={`${
								!showBottomImages ? "hidden" : ""
							} w-5 h-5 rotate-90`}
						/>
					</button>
				</div>
				<!-- under moible mode -->
				{#if showBottomImages}
					<ChatImageCard
						extraClass="sm:hidden"
						on:clickSend={uploadImagesToChat}
						on:clickImage={(e) => {
							const idx = e.detail;
							currentDragImageList[idx] = !currentDragImageList[idx];
						}}
						on:uploadBegin={handleUploadBegin}
						on:uploadEnd={handleUploadEnd}
					/>
				{/if}

				{#if showBottomPrompt}
					<Scrollbar className="max-h-44 pb-2 w-full mt-2" classLayout="">
						{#each Object.entries(prompts) as [k, v]}
							<p class="text-sm font-semibold text-[#15325f]">{k}</p>
							{#each v as badge}
								<button class="mr-2" on:click={() => (query = fullPromptMap(badge)[k])}>
									<Badge
										color="blue"
										class="my-2 inline-block w-full whitespace-nowrap border-[#000] py-1 outline-[#000]"
									>
										{badge}
									</Badge>
								</button>
							{/each}
						{/each}
					</Scrollbar>
				{/if}
			</div>
		</div>
		<ChatImageCard
			extraClass="max-sm:hidden"
			on:clickSend={uploadImagesToChat}
			on:clickImage={(e) => {
				const idx = e.detail;
				currentDragImageList[idx] = !currentDragImageList[idx];
			}}
			on:uploadBegin={handleUploadBegin}
			on:uploadEnd={handleUploadEnd}
		/>
	</div>
</DropZone>
