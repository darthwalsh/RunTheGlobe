# Run The Globe

## Cloud setup

Create [secrets](https://dev.to/googlecloud/using-secrets-in-google-cloud-functions-5aem)
`strava-client-id` and `strava-client-secret`

## Web TODO

https://github.com/JamesRandall/StravaAPIProxy/blob/master/routes/tokenExchange.js

https://firebase.google.com/docs/auth/web/custom-auth\
https://firebase.google.com/docs/auth/admin/create-custom-tokens

Then using strava Oauth, can store the cookie in i.e. firestore and sync to web client. Leaflet talks directly to heatmap with cookie.

### Request flow

Client just wants GetAllRoutes() and GetAllActivities()

Maybe some could be cached locally in web client, and send only list of
ALREADY_HAVE, or send the date of the newest?

Client calls cloud function with strava auth. *(Web doing the writes would need unrestricted write access to cloud storage!)* Cloud function checks:
* if in cloud storage, return data
* otherwise
  * calls to strava API
  * writes to cloud storage
  * returns data

MAYBE have webhook for new IDs

### Cleanup

Delete `gs://webfiles-rtg-carlwa/`
