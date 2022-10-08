# Map Painter

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

## Roadmap

- [ ] Use own OAuth tokens for Strava API calls
- [ ] Fix double "Downloading" message
- [ ] Try color overlay so walked white heatmap becomes different color than unwalked
- [ ] Try different colors for "Areas I want to explore" like yellow or pink
- [ ] Make mask from OSM walkable paths
- [ ] Make overlay for Private roads, maybe big red radious with white slashes (like no trespassing)
- [ ] Make masks with circles around home
- [ ] Make masks with isocrones from walkable paths (very cool if this could smoothly scale from i.e. 1 to 5 miles)
