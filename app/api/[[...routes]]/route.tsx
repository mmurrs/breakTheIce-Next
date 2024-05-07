/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/', (c) => {
  const framesUrl = new URL("http://localhost:3001"); 
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

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)

