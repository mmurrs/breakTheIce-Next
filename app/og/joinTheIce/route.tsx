    /* eslint-disable @next/next/no-img-element  */
// @ts-nocheck
import { ImageResponse } from 'next/og'

export const runtime = 'edge';

export async function GET(req: Request) {
    const cleanedUrlString = req.url.replace(/&amp%3B/g, '&');
    const { searchParams } = new URL(cleanedUrlString); 

    let rightSide ;
    let leftSide;
    let timeRemainingMinFmt;
    let timeRemainingSecFmt;
    let timeRemainingFmt;
    let timeRemainingArray;
    let currClick;
    let targetClicks;
    let timeRemainingHourFmt;
    const usernames = getUsernames(searchParams);
    if ( searchParams.get('row_qp') !== null && searchParams.get('row_qp') === '1' ) {
        rightSide = renderIfRoundWon(usernames)
    } 
    if ( searchParams.get('ro_qp') !== null && searchParams.get('ro_qp') === '1' ) {
        timeRemainingHourFmt = searchParams.get('trhf_qp');
        timeRemainingMinFmt = searchParams.get('trmf_qp');
        timeRemainingSecFmt = searchParams.get('trsf_qp');
        timeRemainingFmt = `${timeRemainingHourFmt} : ${timeRemainingMinFmt} : ${timeRemainingSecFmt}`;
        timeRemainingArray = timeRemainingFmt.split(' ');

        currClick = searchParams.get('cc_qp');
        targetClicks = searchParams.get('tc_qp');
        leftSide = leftSideIfRoundOver(timeRemainingArray, currClick, targetClicks)
        rightSide = renderIfRoundOver(usernames)
    } 
  



    const ogImgFirstFrame = await fetch(new URL('../../../public/mid_game.png', import.meta.url)).then(
        (res) => res.arrayBuffer(),
    );

    return new ImageResponse (
        (
            <div 
                tw='flex text-white w-screen h-full bg-black'
            >
                <div tw='flex relative w-1/2 h-full'>
                    <img tw='h-full' src={ogImgFirstFrame} alt="Image of the First Frame" />
                    {leftSide}
                </div> 
                {rightSide}
            </div>
        )
    )
}

function getUsernames(_searchParams: URLSearchParams) {
    let usersQp_key: string[] = [
        "user1_qp", "user2_qp", "user3_qp", "user4_qp", "user5_qp", "user6_qp", "user7_qp", "user8_qp", "user9_qp", "user10_qp"
      ] 
    let userQp_val: string[] = []
    let val: string = ""

    for (let i = 0; i < usersQp_key.length; i++) {
        val = _searchParams.get(usersQp_key[i])
        if (val !== null && val.length > 0 ) {
            userQp_val.push(val)
        } else {
            break;
        }
    }

    return userQp_val
}

function renderIfRoundWon(usernames: string[]) {
    return (
        <div tw='flex flex-col left-12 top-6 flex relative w-1/2 h-full'>
                    <div tw='flex text-4xl pt-2 pl-12 left-20 text-nowrap'>
                        Round Winners
                    </div>
                    {usernames.length !== 0 && ( usernames.map((item, index) => (
                        <div tw='flex text-3xl pt-2 pl-54'>
                            {index + 1}. {item}
                        </div>
                     )))}
        </div>
    )
}
function renderIfRoundOver(usernames: string[]) {
    return (
        <div tw='flex flex-col left-12 top-6 flex relative w-1/2 h-full'>
                    <div tw='flex text-4xl pt-2 pl-12 left-28 text-nowrap'>
                        Current Players
                    </div>
                    {usernames.length !== 0 && ( usernames.map((item, index) => (
                        <div tw='flex text-3xl pt-2 pl-54'>
                            {index + 1}. {item}
                        </div>
                     )))}
        </div>
    )
}
function leftSideIfRoundOver(timeRemainingArray: string[], currClick: string, targetClicks: string) {
    return (
                <div tw='flex flex-col w-full h-full absolute text-5xl px-8 py-12 left-4 space-y-4'>
                        <div tw='flex rounded-[34px] p-12  bg-blue-300 bg-opacity-80 shadow-lg'>
                            {timeRemainingArray.map((item, index) => (
                                <div tw='flex flex-col space-y-4 items-center' key={index}>
                                    {item}
                                    {index === 0 && <span tw="mx-2">HOURS</span>}
                                    {index === 2 && <span tw="mx-2">MINS</span>}
                                    {index === 4 && <span tw="mx-2">SECS</span>}
                                </div>
                            ))}
                        </div>
                        <div tw='flex flex-col left-24 top-12 text-[#0C3F69]'>
                            <div tw='flex text-6xl font-extrabold'>
                                Spots Taken
                            </div>
                            <div tw='flex left-30 text-9xl text-[#0C3F69]'>
                                {currClick} / {targetClicks}
                            </div>
                        </div>
                    </div> 
    )
}



    