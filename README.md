# Run The Globe

## GCP Cloud Storage setup

One time setup:

```shell
gsutil mb -p runtheglobe -b on gs://webfiles-rtg-carlwa
gsutil iam ch allUsers:objectViewer gs://webfiles-rtg-carlwa

echo '[{"origin": ["*"], "responseHeader": ["Content-Type"], "method": ["GET", "HEAD"], "maxAgeSeconds": 3600}]' > cors-config.json
gsutil cors set cors-config.json gs://webfiles-rtg-carlwa
```

To upload i.e. https://storage.googleapis.com/webfiles-rtg-carlwa/progressMask.png
```shell
gsutil cp (Resolve-Path ~/.rtg/progressMask.png) gs://webfiles-rtg-carlwa
gsutil cp (Resolve-Path ~/.rtg/combinedTiles.png) gs://webfiles-rtg-carlwa
```

Uploading heatmap:

```shell
cd \.rtg\db; gsutil cp -r tiles gs://webfiles-rtg-carlwa/
```

## Web TODO

Put my strava client id and secret into secret manager:\
https://dev.to/googlecloud/using-secrets-in-google-cloud-functions-5aem

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
