# education-hackathon

## AWS Credentials

AWS Workshop studio -> AWS Account Access -> Get AWS CLI Credentials -> Linux or MacOS
Paste the 4 lines into a .env file.
That will authenticate aws.

Then run `make update`. - Grant :)

## Frontend Environment Variables

Create `frontend/.env.local` with the following:

```
VITE_WS_URL=wss://hdsxupfnn6.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_toRdK7bIc
VITE_COGNITO_CLIENT_ID=5efl7gv7v0j7e9oihqprmlctn6
VITE_COGNITO_DOMAIN=education-hackathon-247826798819.auth.us-east-1.amazoncognito.com
VITE_GOOGLE_CLIENT_ID=590450215782-kufkb0s1btdrs314g0hf5bg6h5nkmfnc.apps.googleusercontent.com
```

| Variable | Where to find it |
|---|---|
| `VITE_WS_URL` | SAM stack output `WebSocketUrl` |
| `VITE_COGNITO_USER_POOL_ID` | SAM stack output `CognitoUserPoolId` |
| `VITE_COGNITO_CLIENT_ID` | SAM stack output `CognitoClientId` |
| `VITE_COGNITO_DOMAIN` | Cognito console -> User Pool -> App integration -> Domain |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client ID |

If the SAM stack is redeployed and Cognito resources are recreated, the User Pool ID and Client ID will change. Update `.env.local` with the new values from the stack outputs:

```bash
aws cloudformation describe-stacks --stack-name education-hackathon --query "Stacks[0].Outputs" --output table
```

## Google Sign-In Setup

Google sign-in uses [Google Identity Services (GIS)](https://developers.google.com/identity/gsi/web/guides/overview) with an in-page button (no redirect flow).

### Authorized JavaScript Origins

In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), click the OAuth 2.0 Client ID and add these under **Authorized JavaScript origins**:

For local development:
```
http://localhost:5173
http://localhost:5174
http://localhost:5175
```

For production (CloudFront):
```
https://d3h6z54ed7kcqq.cloudfront.net
```

If the CloudFront distribution is recreated or you use a custom domain, add that origin here too. Changes take ~30 seconds to propagate.

## Deploying

### Backend (SAM)

```bash
cd /path/to/education-hackathon
sam build
sam deploy --resolve-s3 --parameter-overrides GoogleClientId=590450215782-kufkb0s1btdrs314g0hf5bg6h5nkmfnc.apps.googleusercontent.com GoogleClientSecret=<secret>
```

### Frontend (CloudFront)

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://education-hackathon-frontend-<account-id>/ --delete
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```
