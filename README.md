# MIT IdentiBot

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

MIT IdentiBot is an open-source Discord bot written in Node.js that verifies individuals' affiliations with MIT, grants
them roles in a Discord server, and stores information about them in a database backend.

## Set-Up

### Setting up the MongoDB Database

1. Create the `config` collection, which is where IdentiBot stores settings that require storage in a database. Create
   one document with each of the following `_name` attributes:
    * `servers`, which is formatted as follows:

```json
{
  "_name": "servers",
  "data": {
    "<SERVER/GUILD ID>": {
      "verification": {
        "verifiedRole": "<ID OF ROLE TO ASSIGN TO USERS ONCE THEIR KERBEROS IDENTITY IS VERIFIED>",
        "autochangeNickname": true,
        "allowedAffiliations": [
          "<ALLOWED AFFILIATIONS TO VERIFY A USER FOR THIS SERVER (one or more of 'student', 'faculty', 'staff', 'affiliate')>"
        ]
      }
    }
  }
}
```

2. **[RECOMMENDED]** Create an index for the `_name` attribute in the `config` collection.

## Technologies

IdentiBot makes use of the following technology stack for core functionality:

| Library                                                             | Functionality Provided                      |
|---------------------------------------------------------------------|---------------------------------------------|
| [Express](https://expressjs.com/)                                   | Routing and middleware for the REST API     |
| [Discord.js](https://discord.js.org/)                               | Most interactions with the Discord API      |
| [MongoDB](https://www.mongodb.com/)                                 | Database engine                             |
| [`node-openid-client`](https://github.com/panva/node-openid-client) | OpenID operations for identity verification |
| [`yaml`](https://eemeli.org/yaml/#yaml)                             | Parsing YAML (configuration files, etc.)    |
