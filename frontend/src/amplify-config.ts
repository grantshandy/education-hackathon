import { Amplify } from 'aws-amplify'

const currentOrigin = `${window.location.origin}/`

const allRedirects = [
  'http://localhost:5173/',
  'http://localhost:5174/',
  'http://localhost:5175/',
  'https://d3h6z54ed7kcqq.cloudfront.net/',
]

if (!allRedirects.includes(currentOrigin)) {
  allRedirects.push(currentOrigin)
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN as string,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: allRedirects,
          redirectSignOut: allRedirects,
          responseType: 'code',
        },
      },
    },
  },
})
