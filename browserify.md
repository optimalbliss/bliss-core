npm install --g browserify
cd scheduling
npm install .
browserify src/browserify.js --standalone bliss > ../client/lib/bliss.js
beefy src/browserify.js --standalone bliss > ../client/lib/bliss.js
