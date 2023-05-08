# Run The Globe

RunTheGlobe is an in-progress web app that tries to make it easier to explore cool running locations.

Try it at https://run.carlwa.com/

Functionality:

* View Strava Global Heatmap (using your personal data)
* Sign in with Strava to sync global heatmap across devices
* Overlay your Strava Routes 

## For developers

If you want to create your own copy of the app.

### Cloud setup

Create [secret](https://dev.to/googlecloud/using-secrets-in-google-cloud-functions-5aem) `strava-client-secret` 

Publish [serverless function](functions/) for OAuth token exchange.

Give functions IAM account permission to read secrets, and create custom auth tokens:

    gcloud secrets add-iam-policy-binding strava-client-secret --role roles/secretmanager.secretAccessor --member serviceAccount:runtheglobe@appspot.gserviceaccount.com
    gcloud projects add-iam-policy-binding runtheglobe --member serviceAccount:runtheglobe@appspot.gserviceaccount.com --role roles/iam.serviceAccountTokenCreator

### Run app on localhost

Needed for strava auth, which won't redirect to a `file://` URL

    python -m http.server

Some shortcuts are made when running on a dev environment. Go to URL http://localhost:8000/?PROD_ENV to skip the shortcuts.
