# Chit-Chat

> Chit-Chat is a full-fledge messaging and media sharing application with features like:
> - Search people and groups
> - Create group to chat with multiple people at the same time.
> - Send, edit, delete messages with seen status of every message.
> - Send any file or image as attachment. (LIMIT: 25MB)
> - Stable audio/video calls
> - Authentication with Google

## FrontEnd Stack

- React + TypeScript
- SASS
- Vite
- Socket.io

## BackEnd Stack

> Refer to chit-chat backend repo: https://github.com/regex5440/chit-chat-server

## Node version

> `>= v18.14.0`

## Environment

> Create a `.env` file in the root directory and set the following variables:

```
CC_ServerDomain=<API Server Domain>  #This app limits the resource sharing with CORS.
CC_IMAGE_BUCKET_URL=<S3 or R2 Bucket URL>
CC_ASSET_BUCKET_URL=<S3 or R2 Bucket URL>
CC_OAuthClientID=<Google OAuth Client Id>
```

> Replace the `<---HINT---->` with your own values.

## Available Scripts

`npm start`

> Run the app locally on machine at `localhost:5173`.
