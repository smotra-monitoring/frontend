// 1. Define the Manager (The Radio Station)
interface Navigation extends EventTarget {
    addEventListener(
        type: 'navigate',
        callback: (event: NavigateEvent) => void,
        options?: boolean | AddEventListenerOptions
    ): void;
    // Add other methods if you use them, like navigation.back()
    readonly canGoBack: boolean;
    readonly canGoForward: boolean;
}

// 2. Define the Event (The Song)
interface NavigateEvent extends Event {
    readonly canIntercept: boolean;
    readonly destination: {
        readonly url: string;
        readonly id: string | null;
        readonly index: number;
        readonly sameDocument: boolean;
    };
    readonly downloadRequest: string | null;
    readonly hashChange: boolean;
    readonly info: any;
    readonly navigationType: 'push' | 'replace' | 'reload' | 'traverse';
    readonly signal: AbortSignal;
    readonly userInitiated: boolean;

    intercept(options?: {
        handler?: () => Promise<void>;
        focusReset?: 'after-transition' | 'manual';
        scroll?: 'after-transition' | 'manual';
    }): void;

    scroll(): void;
}

// 3. Attach the Manager to the Window
interface Window {
    navigation: Navigation;
}