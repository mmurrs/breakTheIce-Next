import 'server-only'
import Redis from 'ioredis';





const client = new Redis({port: 13192, host: 'redis-13192.c326.us-east-1-3.ec2.cloud.redislabs.com', password: 'nZUpPOLpXmmeQBTSUL5X3ByDwlPgXE9Y'});
  



  
  

export default client;