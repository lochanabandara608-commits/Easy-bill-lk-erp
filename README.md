EASY BILL LK - EXE project (GitHub upload)

Upload these to the ROOT of your GitHub repository (same level):
  index.html        (the POS app)
  main.js
  preload.js
  package.json
  build/icon.png    (your app icon)
  build/icon.ico
  .github/workflows/build.yml   (the build recipe)

Then: GitHub -> Actions -> "Build Windows EXE" -> Run workflow.
When it finishes, download the artifact "EASY-BILL-LK-Setup" and install the .exe.

To update the app later: replace index.html in GitHub and run the workflow again.