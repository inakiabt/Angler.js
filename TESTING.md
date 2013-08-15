Tests should be run using npm (Node Package Manager)

If you do not already have it, run ```sudo apt-get install nodejs```. After installation, navigate to the root angler.js directory and run ```npm install``` to install all necessary dependencies.

Next, you will need phantomjs, which is a headless browser for simulating a proper test environment. You can find a working binary at phantomjs.org.

Assuming everything has installed correctly, you can now run ```npm test``` to start the main test file, init.js, which will run all appropriate test files through phantomjs.

***Note that init.js will look for both your copy of angler.js as well as phantomjs in the angler.js root directory.
