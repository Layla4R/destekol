import type { IframeHTMLAttributes } from 'react';

export default function ConsentEmbed(props: IframeHTMLAttributes<HTMLIFrameElement>) {
    return <iframe {...props}/>;
}
