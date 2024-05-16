import 'server-only'
import Redis from 'ioredis';





const client = new Redis({port: 13054, host: 'redis-13054.c17.us-east-1-4.ec2.redns.redis-cloud.com', password: 'UchVl7nf0mistdJGIUJedim6CGvFqE3i'});
  



  
  

export default client;