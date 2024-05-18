/* eslint-disable @next/next/no-img-element  */
// @ts-nocheck
import { ImageResponse } from 'next/og'


export const runtime = 'edge';

export async function GET(req: Request) { 
    const ogImgFirstFrame = process.env.NEXT_PUBLIC_FIRST_FRAME_URL
    // await fetch(new URL('../../../public/first_frame.png', import.meta.url)).then(
    //     (res) => res.arrayBuffer(),
    // );

    let title = "Don't Break the Ice"
    let rule_1 = "Click the button to get on the ice."
    let rule_2 = "Too many on the ice and the game restarts."

    return new ImageResponse (
        (
            <div 
                tw='flex text-white w-screen h-full bg-black'
            >
                <img tw='w-1/2 h-full' src={ogImgFirstFrame} alt="Image of the First Frame" />
                <div tw="flex  w-1/2">
                    <div tw="flex flex-col h-full" >
                        <div tw='text-6xl p-7 underline underline-offset-4'>
                            {title}
                        </div> 
                        <div tw="flex text-3xl flex-col p-7">
                            <div tw='justify-center text-center text-wrap'>{rule_1}</div>
                            <div tw='justify-center text-center text-wrap'>{rule_2}</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    )
}