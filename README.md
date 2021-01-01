# Run The Globe

## GCP Cloud Storage setup

To get 

```shell
gsutil mb -p runtheglobe -b on gs://webfiles-rtg-carlwa
gsutil iam ch allUsers:objectViewer gs://webfiles-rtg-carlwa
```

To upload i.e. https://storage.googleapis.com/webfiles-rtg-carlwa/progressMask.png
```shell
gsutil cp (Resolve-Path ~/.rtg/progressMask.png) gs://webfiles-rtg-carlwa
gsutil cp (Resolve-Path ~/.rtg/combinedTiles.png) gs://webfiles-rtg-carlwa
```
