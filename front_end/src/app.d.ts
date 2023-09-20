// See: https://kit.svelte.dev/docs/types#app
// import { Result} from "neverthrow";

interface ChatMessage {
	role: string,
	content: string
}

interface Window {
	deviceType: string;
}