    /* eslint-disable @next/next/no-img-element  */
// @ts-nocheck
import { ImageResponse } from 'next/og'

export const runtime = 'edge';

export async function GET(req: Request) {
    const cleanedUrlString = req.url.replace(/&amp%3B/g, '&');
    const { searchParams } = new URL(cleanedUrlString); 

    let statement;
    if ( searchParams.get('ra_qp') !== null && searchParams.get('ra_qp') === '1' ) {
        statement =  `You cracked the ice :/`
    } 
  



    const ogImgFirstFrame = await fetch(new URL('../../../public/cracking_ice.png', import.meta.url)).then(
        (res) => res.arrayBuffer(),
    );

    return new ImageResponse (
        (
            <div 
                tw='flex text-[#0C3F69] w-screen h-full'
            >
                <img tw='h-full w-full relative ' src={ogImgFirstFrame} alt="Image of the First Frame" />
                <div tw='flex absolute h-full text-5xl top-65 left-90'>
                    {statement}
                </div> 
            
            </div>
        )
    )
}

