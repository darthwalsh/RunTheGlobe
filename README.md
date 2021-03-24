# Run The Globe

## Cloud setup

Create [secret](https://dev.to/googlecloud/using-secrets-in-google-cloud-functions-5aem) `strava-client-secret` 

    gcloud secrets add-iam-policy-binding strava-client-secret --role roles/secretmanager.secretAccessor --member serviceAccount:runtheglobe@appspot.gserviceaccount.com
    gcloud projects add-iam-policy-binding runtheglobe --member serviceAccount:runtheglobe@appspot.gserviceaccount.com --role roles/iam.serviceAccountTokenCreator

Publish [serverless function](functions/) for OAuth token exchange.

## Web TODO

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
