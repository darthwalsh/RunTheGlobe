# Run The Globe

RunTheGlobe is an in-progress web app that tries to make it easier to explore cool running locations.

Try it at http://run.carlwa.com/

Functionality:

* View Strava Global Heatmap (using your personal data)
* Sign in with Strava to sync global heatmap across devices
* Overlay your Strava Routes 

## For developers

If you want to create your own copy of the app.

## Cloud setup

Create [secret](https://dev.to/googlecloud/using-secrets-in-google-cloud-functions-5aem) `strava-client-secret` 

Publish [serverless function](functions/) for OAuth token exchange.

Give functions IAM account permission to read secrets, and create custom auth tokens:

    gcloud secrets add-iam-policy-binding strava-client-secret --role roles/secretmanager.secretAccessor --member serviceAccount:runtheglobe@appspot.gserviceaccount.com
    gcloud projects add-iam-policy-binding runtheglobe --member serviceAccount:runtheglobe@appspot.gserviceaccount.com --role roles/iam.serviceAccountTokenCreator

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
