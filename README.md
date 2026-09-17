# StudyMate — AI Study Companion

A lo-fi-themed AI study buddy that reads your course materials and answers questions via voice or text chat, powered by AWS Bedrock, Polly, and Cognito.

**Live:** https://d3h6z54ed7kcqq.cloudfront.net

## Prerequisites

- AWS CLI v2 configured with credentials (`aws configure` or environment variables)
- AWS SAM CLI
- Node.js 22+
- Python 3.12
- A Google OAuth 2.0 Client ID (for Google sign-in)

If you use Nix, `nix-shell` will provide all of the above except AWS credentials.

## Quick Start (Using the Existing Deployed Stack)

If the stack is already deployed and you just want to run the frontend locally:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The `.env.example` is pre-filled with the current stack values. The app runs at http://localhost:5173.

If stack outputs have changed, get fresh values with:

```bash
aws cloudformation describe-stacks \
  --stack-name education-hackathon \
  --query "Stacks[0].Outputs" \
  --output table
```

## Deploying From Scratch

### 1. Deploy the backend (SAM)

You need the Google OAuth client ID and secret. The SAM template creates Cognito, DynamoDB, Lambda, API Gateway (HTTP + WebSocket), S3, and CloudFront.

```bash
sam build
sam deploy \
  --stack-name education-hackathon \
  --region us-east-1 \
  --no-confirm-changeset \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    GoogleClientId=<your-google-client-id> \
    GoogleClientSecret=<your-google-client-secret>
```

### 2. Configure the frontend

Copy the stack outputs into `frontend/.env.local`:

```bash
cd frontend
cp .env.example .env.local
```

Then update the values from the stack outputs:

| Variable | Stack Output |
|---|---|
| `VITE_WS_URL` | `WebSocketUrl` |
| `VITE_API_URL` | `HttpApiUrl` |
| `VITE_COGNITO_USER_POOL_ID` | `CognitoUserPoolId` |
| `VITE_COGNITO_CLIENT_ID` | `CognitoClientId` |
| `VITE_COGNITO_DOMAIN` | Cognito console → User Pool → App integration → Domain |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth client ID |

### 3. Deploy the frontend

```bash
cd frontend
npm install
npm run build
aws s3 sync dist/ s3://education-hackathon-frontend-247826798819/ --delete
aws cloudfront create-invalidation --distribution-id E3EGKG3A8YBGC2 --paths "/*"
```

Or use the Makefile shortcut:

```bash
make deploy-frontend
```

### 4. Google OAuth setup

In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add these **Authorized JavaScript origins** to your OAuth 2.0 Client ID:

```
http://localhost:5173
http://localhost:5174
http://localhost:5175
https://d3h6z54ed7kcqq.cloudfront.net
```

## Architecture

```
Browser → CloudFront → S3 (static frontend)
       → WebSocket API Gateway → Lambda (ws_message)
           → Bedrock Claude Sonnet 4.6 (chat)
           → Amazon Polly (TTS + visemes)
           → S3 (audio files)
           → DynamoDB (connections, sessions, courses)
       → HTTP API Gateway → Lambda (courses, sessions, documents)
           → S3 (uploaded documents)
           → Bedrock Knowledge Base (RAG retrieval)
```

## Environment Variables Reference

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_WS_URL` | WebSocket endpoint for real-time chat |
| `VITE_API_URL` | HTTP API endpoint for REST calls |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID for auth |
| `VITE_COGNITO_CLIENT_ID` | Cognito App Client ID |
| `VITE_COGNITO_DOMAIN` | Cognito hosted UI domain |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |

### Backend (set automatically by SAM)

| Variable | Description |
|---|---|
| `BEDROCK_MODEL_ID` | Claude model ID (default: `us.anthropic.claude-sonnet-4-6`) |
| `POLLY_VOICE_ID` | Amazon Polly voice (default: `Joanna`) |
| `AUDIO_BUCKET` | S3 bucket for TTS audio |
| `DOCUMENTS_BUCKET` | S3 bucket for uploaded study materials |
| `KNOWLEDGE_BASE_ID` | Bedrock Knowledge Base ID for RAG |
| `CONNECTIONS_TABLE` | DynamoDB table for WebSocket connections |
| `SESSIONS_TABLE` | DynamoDB table for study sessions |
| `COURSES_TABLE` | DynamoDB table for courses |
