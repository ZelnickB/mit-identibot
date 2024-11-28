# MIT IdentiBot

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

MIT IdentiBot is an open-source Discord bot written in Node.js that verifies individuals' affiliations with MIT, grants
them roles in a Discord server, and stores information about them in a database backend.

## Set-Up

### Setting up the MongoDB Database

1. Create the `config.servers` collection, which is where IdentiBot stores settings for individual servers. Create
   documents with the following format:
```json
{
   "_name": "servers", 
   "_serverId": "<SERVER/GUILD ID>",
   "authorized": true,
   "verification": {
     "verifiedRole": "<ID OF ROLE TO ASSIGN TO USERS ONCE THEIR KERBEROS IDENTITY IS VERIFIED>",
     "autochangeNickname": true,
     "allowedAffiliations": [
       "<ALLOWED AFFILIATIONS TO VERIFY A USER FOR THIS SERVER (one or more of 'student', 'faculty', 'staff', 'affiliate')>"
     ]
   }
}
```

2. **[RECOMMENDED]** Create an index for the `_serverId` attribute in the `config.servers` collection.

## Technologies

IdentiBot makes use of the following technology stack for core functionality:

| Library                                                             | Functionality Provided                      |
|---------------------------------------------------------------------|---------------------------------------------|
| [Express](https://expressjs.com/)                                   | Routing and middleware for the REST API     |
| [Discord.js](https://discord.js.org/)                               | Most interactions with the Discord API      |
| [MongoDB](https://www.mongodb.com/)                                 | Database engine                             |
| [`node-openid-client`](https://github.com/panva/node-openid-client) | OpenID operations for identity verification |
| [`yaml`](https://eemeli.org/yaml/#yaml)                             | Parsing YAML (configuration files, etc.)    |
