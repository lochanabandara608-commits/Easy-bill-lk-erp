EASY BILL LK - Desktop (EXE) package
------------------------------------
1. Install Node.js LTS (https://nodejs.org) - one time only.
2. Double-click build-exe.bat  (needs internet the first time).
3. Open the "dist" folder -> you get:
     EASY BILL LK Setup 1.0.0.exe  = installer
     EASY BILL LK 1.0.0.exe        = portable (copy to any PC / USB)

To test without building:  npm install  then  npm start

To update the app later: replace index.html with the new HTML file
(keep the name index.html) and run build-exe.bat again.

Note: the app still needs internet for Firebase login / cloud sync.