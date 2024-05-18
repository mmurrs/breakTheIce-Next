/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
// import { neynar } from 'frog/hubs';
import { handle } from 'frog/vercel';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';

// Redis
import { createClient, RedisClientType } from 'redis';
let client: RedisClientType;
let host = process.env.NEXT_PUBLIC_HOST
let port = process.env.NEXT_PUBLIC_PORT
let gameDuration: number;
let gameEndTime: number;
let startTargetClicks: number;
let roundKey: any;
let baseReward: number;
let roundReward: number;
let potMultiplier: number;

if (host && port) {
  // Update with redis to use functons or can do dummy data
  client = createClient({
    password: '',
    socket: {
      host: host,
      port: parseInt(port)
    }
  });
  client.on('error', err => console.log('Redis Client Error', err));

  (async () => {
    await client.connect();
  })()

  // Setup game constraints
  gameDuration = 1 * 60 * 100;
  gameEndTime = Date.now() + gameDuration;
  // const startTargetClicks = Math.floor(Math.random() * 10) + 1;
  startTargetClicks = 1;
  roundKey = "round:clickers";
  baseReward = 1;
  roundReward = baseReward;
  potMultiplier = 1.1;


  (async () => {
    // TODO: Remove
    await client.del('userScores');
  })()

  client.multi()
    .del(roundKey)
    .set('roundEndTime', gameEndTime.toString())
    .set('targetClicks', startTargetClicks)
    .set('baseReward', baseReward)
    .set('roundReward', roundReward)
    .zAdd('userScores', { score: 0, value: 'Swell'})
    .exec();
  // End game setup
}




// Function to start a new round
// Used after time limit is broken or currClicks exceeds numClicks
async function initializeGameState(increasePot: boolean ) {
  console.log("Resetting game state")
  // const targetClicks = Math.floor(Math.random() * 10) + 1;
  const targetClicks = 1; 
  // Redis calls to set the state of the game
  if(increasePot){
    // 1.2 * 1.1 instead I just want 10
    // 10% increase but to 2 sig figs
    roundReward = parseFloat((roundReward * potMultiplier).toString()).toFixed(2) as any;
  }
  try{
    client.multi()
    .set('targetClicks', targetClicks)
    .set('roundEndTime', Date.now() + gameDuration)
    .set('roundReward', roundReward)
    .del(roundKey)
    .exec();
  } catch(err){
    console.error("Error in resetting game: ", err)
  }
  

  console.log("Finished resetting");
}

// Helpers
// Function to format timeRemaining in human readable format, hours:minutes:seconds
function formatTime(timeRemaining: number) {
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  return [`${Math.abs(hours)}`, `${Math.abs(minutes)}`, `${Math.abs(seconds)}`];
}

async function getFormattedTimeRemaining(){
  const roundEndTime = parseInt(await client.get("roundEndTime") as string, 10);
  const currTime = Date.now();
  const timeRemaining = roundEndTime - currTime;
  const timeRemainingFormatted = formatTime(timeRemaining);
  return timeRemainingFormatted;
}

// Used for fetching Farcaster username
async function getUsernames(fids: string[]) {
  // join the fids with a comma
  const fidsString = fids.join(',');
  console.log("fidsString: ", fidsString);
  const usernameUrl = 'https://api.neynar.com/v2/farcaster/user/bulk?fids=';
  // TODO - api key from env
  const neynarOptions = {
    method: 'GET',
    headers: { accept: 'application/json', api_key: '14575066-A15B-4807-9508-F260E1B2223A' }
  };
  let temp: any = [];
  let allUsernames = [];

  console.log("about to get the username");
  // Fetch the Username from Fid
  try{
    await fetch(usernameUrl + fidsString, neynarOptions)
    .then(res => res.json())
    .then(usernameJson => {
      temp = usernameJson["users"]
    })
    .catch(err => console.error('error:' + err));
    // Loop through temp and creating a new array of "usernames" from temp[i]["username"]
    // looop through temp and only returns the "display_name" from temp[i]["display_name"]    
    for(let i = 0; i < temp.length; i++){
      allUsernames.push(temp[i]["username" as any] as string);
    }
  console.log("allUsernames: ", allUsernames);
  } catch (err) {
    console.error('error:' + err);
  }

  console.log("After getting the usernames");
  
  return allUsernames;
}

// Function to get all the fids of the users who have clicked the button and then return the usernames
async function getCurrentPlayers(){
  console.log("Calling getCurrentPlayers");
  // Call to redis to get the current players
  const currFids = await client.sMembers(roundKey);
  console.log("currFids: ", currFids);
  // No users have clicked the button
  if(currFids == null){
    return [];
  }
  console.log("currFids: ", currFids);
  // We'll have to loop and update all the individual users mappings of their rewards

  const usernames = await getUsernames(currFids);
  console.log("After getting usernames");
  return usernames;
}

async function updateWinners(){  
  // We update the winners map
  console.log("Top of update winners");
  const currFids = await client.sMembers(roundKey);
  console.log("after currFids");
  const roundReward = await client.get('roundReward');
  // Loop through the users 
  // Check if they already won
  // If so need to get their increment by the round winning 
  console.log("UpdateWinners - incrementing vals", currFids);
  for(let i in currFids){
    let currUsername = await getUsernames([currFids[i]]);
    console.log("zAdd score: ", roundReward);
    console.log("zAdd value: ", currUsername)
    let res = await client.zIncrBy('userScores', Number(roundReward), currUsername.toString());
    console.log("incrementing this fid: ", res)
  }
}

async function getTop10(){
  console.log("Top of getTop");
  const clienType = await client.type('userScores');
  console.log("Type: ", clienType)
  const topPlayers = await client.zRangeWithScores('userScores', 0, 9, { REV: true});
  console.log("TopPlayers: ", topPlayers);
  for(let player of topPlayers){
    console.log(`Username: ${player.value}, Score: ${player.score}`)
  }
  return topPlayers;
}

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Game Vars
// If X number of people click the button with 3 hour time frame
// all people split the pot
const randomNumber = Math.floor(Math.random() * 10) + 1;

app.use('/*', serveStatic({ root: './public' }))

let framesUrl: URL;
let urlString = process.env.NEXT_PUBLIC_FRAMES_URL;
if (urlString) {
  framesUrl = new URL(urlString)
}


app.frame('/', (c) => {
  let imgUrl = new URL("/og/first_frame", framesUrl).href
  const { buttonValue, inputText, status } = c
 
  return c.res({
    image: imgUrl,
    intents: [
      <Button value="grab" action= "/joinTheIce">Click Me</Button>,
      <Button value="checkGame" action= "/checkGame">Check Game</Button>, 
      <Button value="leaderboard" action= "/leaderboard">Leaderboard</Button>,
      <Button value="rewards" action="/rewards">Check Rewards</Button>
    ],
  })
})

app.frame('/checkGame', async(c) => {
    // Show the number of people who have clicked the button and the remaining time in human readable format 
    // TODO: Include usernames of people who have clicked the button
    // const roundEndTime = parseInt(await client.get("roundEndTime") as string, 10);
    // get number of people who have clicked the button or 0 if no one has clickd the button
    const potentialClickers =  Number(await client.sCard(roundKey));
    const currClicks = potentialClickers != null ? potentialClickers : 0;
    console.log("potentialClickers: ", potentialClickers);
    // const currClicks = Number(await client.sCard(roundKey)) || 0;
    const targetClicks = Number(await client.get('targetClicks'));
    const roundEndTime = parseInt(await client.get("roundEndTime") as string, 10);
    const currTime = Date.now();
    const timeRemaining = roundEndTime - currTime;
    const timeRemainingFormatted = formatTime(timeRemaining);
  
    const roundReward = Number(await client.get('roundReward'))

    // // Get the usernasmes of the people who have clicked the button
    let usernames = await getCurrentPlayers();
    console.log("usernames: ", usernames);
    console.log("currClick: ", currClicks);
    console.log("targetClicks: ", targetClicks);

    // query params
    let qp = getCheckGameImgParams(timeRemainingFormatted, roundReward, currClicks, targetClicks, usernames)
   
    let imgUrl = new URL(`/og/mid_game${qp}`, framesUrl).href
  
  return c.res({
    image: imgUrl, // rework this to .env
    intents: [
      <Button value="checkGame" action= "/checkGame">Refresh</Button>,
      <Button value="rules" action="/"> Rules </Button>,
    ],
  })
})

// Used to show the resulting time the button is pressed
app.frame('/joinTheIce', async(c) => {
  // Check if the game is over
  // Check if the game is over
  // const gameOver = await client.get('gameOver');
  // if(gameOver == 'true') {
  //   let usernames = await getCurrentPlayers();
  //   return c.res({
  //   image: (
  //     <Box>
  //       <HStack >
  //         <Image 
  //             src= "/mid_game.png"
  //             height="100%"
  //           />
  //           <Box alignContent='center' grow flexDirection='column' fontFamily='madimi' paddingTop="2">
  //               <Spacer size="16" />
  //               <Box alignContent='center' grow flexDirection='column' fontFamily='madimi' paddingTop="4">
  //                 <Heading align="center">Winners</Heading>
  //                 {usernames.map((username) => (
  //                   <Text align="center" color="text200" size="14" font="default">
  //                     {username}
  //                   </Text>
  //               ))}
  //               </Box>
  //           </Box>
  //       </HStack>
  //     </Box>
  //   ),
  //     intents: [
  //       <Button value="checkGame" action= "/checkGame">Refresh</Button>,
  //       <Button value="rules" action="/"> Rules </Button>,
  //     ]
  //   })
  // } 
  // Do game checks to see if it is over or not
  // Case - Curr Time > End Time
  const roundEndTime = parseInt(await client.get("roundEndTime") as string, 10);
  // Case - Clicks > Target Clicks
  const currClicks = Number(await client.sCard(roundKey));
  const targetClicks = Number(await client.get('targetClicks'));
  let updatedClicks;
  console.log("currClick: ", currClicks);
  console.log("targetClicks: ", targetClicks);
  // Case - round is over already
  // Check to see if the game is over or just the round
  if(Date.now() > roundEndTime){
     // Case - Round won
     if(currClicks == targetClicks) {
          console.log("Case - Round Won");
          // TODO: Final Frames to show the users who have clicked the button
          // Update those who have won the game
          await updateWinners();
          const roundWinners = await getCurrentPlayers();
          console.log("Winners: ", roundWinners)
          // Pot should not increase
          // Reset the game
          initializeGameState(false);
          console.log("After init game state, joinIce")
          const qp = getJoinTheIceROWImgParams(roundWinners)
 
          const imgUrl = new URL(`/og/joinTheIce${qp}`, framesUrl).href
          return c.res({
            image: imgUrl, // rework this to .env
            intents: [
              <Button value="checkGame" action= "/checkGame">Refresh</Button>,
              <Button value="rules" action="/"> Rules </Button>,
            ],
          })
        } else {
                // TODO: Update frame to be the same as the base click frame
            console.log("Case - Time expired, start new round");
            // Case - Round is over
            // Setup and start a new round
            // Increase the amount to be won
            initializeGameState(true);
            console.log("After init game state, time expired")

            // Add users to the list
            if(c.frameData?.fid != null){
              try {
                const replies = await client.multi()
                  .sAdd(roundKey, (c.frameData?.fid).toString())
                  .sCard(roundKey)
                  .exec();
                updatedClicks = replies[1];
              } catch (err) {
                // handle error
                throw err;
              }
            }
            const timeRemainingFormatted = await getFormattedTimeRemaining();

            let usernames = await getCurrentPlayers();

            let qp = getJoinTheIceROImgParams(timeRemainingFormatted, currClicks, targetClicks, usernames)

            const imgUrl = new URL(`/og/joinTheIce${qp}`, framesUrl).href
        
            return c.res({
              image: imgUrl, // rework this to .env
              intents: [
                <Button value="checkGame" action= "/checkGame">Refresh</Button>,
                <Button value="rules" action="/"> Rules </Button>,
              ],
            })
        }  
      }

    // Case - Round is still active additional click added
    // Check if currClicks will exceed number of targetClicks

    // Need to include set cardinality so if the same user is being added
    // TODO: Add a check to see if the user is already in the list

    let inList = false;
    if(c.frameData?.fid != null){
      // Check if the user is already in the list of clickers 
      inList = await client.sIsMember(roundKey, (c.frameData?.fid).toString());
    }
    if(currClicks + 1 > targetClicks && !inList){
      console.log("Case - Target num exceeded");
      // Start a new round
      initializeGameState(true);
      console.log("after init game, target num exceeded");
      let qp = '?ra_qp=1'
      const imgUrl = new URL(`/og/cracking_ice${qp}`, framesUrl).href
      return c.res({
        image: imgUrl, // rework this to .env
        intents: [
          <Button value="rules" action="/"> Rules </Button>,
        ],
      })
    }

      // Case - Round is still active
  if(c.frameData?.fid != null) { 
    // TODO: Consider disallowing a person if they break the game
    console.log("Adding a new user to click list", c.frameData?.fid);
    let currFids = [];
    currFids.push(c.frameData?.fid.toString());
    const currUsername = await getUsernames(currFids);
    console.log("currUsername: ", currUsername);
    try {
      const replies = await client.multi()
        .sAdd(roundKey, (c.frameData?.fid).toString())
        // .sAdd((c.frameData?.fid).toString(), currUsername)
        .sCard(roundKey)
        .exec();
      updatedClicks = replies[1] as number;
    } catch (err) {
      // handle error
      throw err;
    } 
    const usernames = await getCurrentPlayers();
    console.log("usernames: ", usernames);
  }

  const timeRemainingFormatted = await  getFormattedTimeRemaining();
  let usernames = await getCurrentPlayers();

  let qp = getJoinTheIceROImgParams(timeRemainingFormatted, currClicks, targetClicks, usernames) // in this case round active

  const imgUrl = new URL(`/og/joinTheIce${qp}`, framesUrl).href
  
return c.res({
  image: imgUrl, // rework this to .env
  intents: [
    <Button value="checkGame" action= "/checkGame">Refresh</Button>,
    <Button value="rules" action="/"> Rules </Button>,
  ],
})
})

app.frame('/leaderboard', async(c) => {
  let top10 = await getTop10(); // Assuming getTop10 returns [{ value: 'farcaster', score: 2.1 }, ...]


  // query params
  let qp = getLeaderboardImgParams(top10)
 console.log(qp)
  let imgUrl = new URL(`/og/leaderboard${qp}`, framesUrl).href

return c.res({
  image: imgUrl, // rework this to .env
  intents: [
    <Button value="rules" action="/"> Rules </Button>,
  ],
})
})


// app.frame('/reward', async(c) => {
//   // Display the username and reward for the current user
//   let userScore = await client.zScore('userScores', 'test');
//   // If no rewards show one screen
//   // If there are rewards show a different screen
//   if(userScore != null){
//     // Show them current reward

//   }

// return c.res({})
// })

function getLeaderboardImgParams(usernames: {
  score: number;
  value: string;
}[]) {
  let usersQp_key: string[] = [
    "user1_qp", "user2_qp", "user3_qp", "user4_qp", "user5_qp", "user6_qp", "user7_qp", "user8_qp", "user9_qp", "user10_qp"
  ] 
  let scoreQp_key: string[] = [
    "score1_qp", "score2_qp", "score3_qp", "score4_qp", "score5_qp", "score6_qp", "score7_qp", "score8_qp", "score9_qp", "score10_qp"
  ] 
  let qps: string[] = [];

  let expectedNoUsers = 10
  if (usernames.length >= 0) {
    let userqp;
    let scoreqp;
    for (let i = 0; i < usernames.length && i <= expectedNoUsers; i++ ) {
       userqp = usersQp_key[i] + "=" + usernames[i].value
       qps.push(userqp)
       scoreqp = scoreQp_key[i] + "=" + usernames[i].score
       qps.push(scoreqp)
    }
  }

  let qp: string = "";

  for (let i = 0; i < qps.length; i++ ) {
        if (i == 0) {
          qp = "?" + qps[0]
          continue
        }
        qp += "&" + qps[i]
  }
  
  return qp
}

function getJoinTheIceROWImgParams(usernames: string[]) {
  let usersQp_key: string[] = [
    "user1_qp", "user2_qp", "user3_qp", "user4_qp", "user5_qp", "user6_qp", "user7_qp", "user8_qp", "user9_qp", "user10_qp"
  ] 
  let qps: string[] = [];
  let row_qp = `row_qp=1`
  qps.push(row_qp)


  let expectedNoUsers = 10
  if (usernames.length >= 0) {
    let userqp;
    for (let i = 0; i < usernames.length && i <= expectedNoUsers; i++ ) {
       userqp = usersQp_key[i] + "=" + usernames[i]
       qps.push(userqp)
    }
  }

  let qp: string = "";

  for (let i = 0; i < qps.length; i++ ) {
        if (i == 0) {
          qp = "?" + qps[0]
          continue
        }
        qp += "&" + qps[i]
  }
  
  return qp
}

function getJoinTheIceROImgParams(trf: string[], cc: number, tc: number, usernames: string[]) {
  let usersQp_key: string[] = [
    "user1_qp", "user2_qp", "user3_qp", "user4_qp", "user5_qp", "user6_qp", "user7_qp", "user8_qp", "user9_qp", "user10_qp"
  ] 
  let qps: string[] = [];
  let trhf_qp = `trhf_qp=${trf[0]}`
  qps.push(trhf_qp)
  let trmf_qp = `trmf_qp=${trf[1]}`
  qps.push(trmf_qp)
  let trsf_qp = `trsf_qp=${trf[2]}`
  qps.push(trsf_qp)
  let ro_qp = `ro_qp=1`
  qps.push(ro_qp)
  let cc_qp = `cc_qp=${cc}`
  qps.push(cc_qp)
  let tc_qp = `tc_qp=${tc}`
  qps.push(tc_qp)

  let expectedNoUsers = 10
  if (usernames.length >= 0) {
    let userqp;
    for (let i = 0; i < usernames.length && i <= expectedNoUsers; i++ ) {
       userqp = usersQp_key[i] + "=" + usernames[i]
       qps.push(userqp)
    }
  }

  let qp: string = "";

  for (let i = 0; i < qps.length; i++ ) {
        if (i == 0) {
          qp = "?" + qps[0]
          continue
        }
        qp += "&" + qps[i]
  }
  
  return qp
}
function getCheckGameImgParams(trf: string[], rr: number, cc: number, tc: number, usernames: string[]) {
  let usersQp_key: string[] = [
    "user1_qp", "user2_qp", "user3_qp", "user4_qp", "user5_qp", "user6_qp", "user7_qp", "user8_qp", "user9_qp", "user10_qp"
  ] 
  let qps: string[] = [];
  let trhf_qp = `trhf_qp=${trf[0]}`
  qps.push(trhf_qp)
  let trmf_qp = `trmf_qp=${trf[1]}`
  qps.push(trmf_qp)
  let trsf_qp = `trsf_qp=${trf[2]}`
  qps.push(trsf_qp)
  let rr_qp = `rr_qp=${rr}`
  qps.push(rr_qp)
  let cc_qp = `cc_qp=${cc}`
  qps.push(cc_qp)
  let tc_qp = `tc_qp=${tc}`
  qps.push(tc_qp)

  let expectedNoUsers = 10
  if (usernames.length >= 0) {
    let userqp;
    for (let i = 0; i < usernames.length && i <= expectedNoUsers; i++ ) {
       userqp = usersQp_key[i] + "=" + usernames[i]
       qps.push(userqp)
    }
  }

  let qp: string = "";

  for (let i = 0; i < qps.length; i++ ) {
        if (i == 0) {
          qp = "?" + qps[0]
          continue
        }
        qp += "&" + qps[i]
  }
  
  return qp
}



devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)




                       