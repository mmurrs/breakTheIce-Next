    /* eslint-disable @next/next/no-img-element  */
// @ts-nocheck
import { ImageResponse } from 'next/og'

export const runtime = 'edge';

export async function GET(req: Request) {
    const cleanedUrlString = req.url.replace(/&amp%3B/g, '&');
    const { searchParams } = new URL(cleanedUrlString); 


    const top10 = getTop10(searchParams);
    console.log(top10)
    let rightSide = renderTop10(top10)


  



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
                </div> 
                {rightSide}
            </div>
        )
    )
}

function getTop10(_searchParams: URLSearchParams) {
    let usersQp_key: string[] = [
        "user1_qp", "user2_qp", "user3_qp", "user4_qp", "user5_qp", "user6_qp", "user7_qp", "user8_qp", "user9_qp", "user10_qp"
      ] 
      let scoreQp_key: string[] = [
        "score1_qp", "score2_qp", "score3_qp", "score4_qp", "score5_qp", "score6_qp", "score7_qp", "score8_qp", "score9_qp", "score10_qp"
      ] 
    let userQp_val: {
        score: number;
        value: string;
      }[] = []
    let val : {
        score: number;
        value: string;
      } = {}
    let score; 
    for (let i = 0; i < usersQp_key.length; i++) {
        val.value = _searchParams.get(usersQp_key[i])
        score = _searchParams.get(scoreQp_key[i])
        
        if (val.value !== null && val.value.length > 0 ) {
            val.score = parseInt(score, 10);
            userQp_val.push({...val})
        } else {
            break;
        }
    }

    return userQp_val
}

function renderTop10(usernames: { value: string; score: number;  }[]) {
    return (
        <div tw='flex flex-col left-12 top-6 flex relative w-1/2 h-full'>
            <div tw='flex text-4xl pt-2 pl-12 left-20 text-nowrap'>
                Leaderboard
            </div>
        
                {usernames.length !== 0 && ( 
                    usernames.map((item, index) => (
                        <div tw='flex text-3xl pt-2 pl-14' key={index}>
                            <div tw='flex flex-row pl-6 pr-6' >
                                <div tw='flex w-1/2 pr-84'>{item.value}</div>
                                <div tw='flex w-1/2 items-end pr-12'>{item.score}</div>
                            </div>
                        </div>
                    ))
                )} 
        </div>
    );
}


    