/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace JSX {
    interface IntrinsicElements {
        'lite-youtube': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
            videoid?: string;
            playlistid?: string;
            videotitle?: string;
            videoplay?: string;
            params?: string;
            posterquality?: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault';
            nocookie?: boolean;
            playlabel?: string;
        };
    }
}
