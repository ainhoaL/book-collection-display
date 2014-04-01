This application is a simple Node.js + Backbone web app (server + client side) to display info gathered with Google Books API for a collection of ebooks in the local file system.
I used this project to start learning Node and Backbone so it is most definitely a work in progress.

TO RUN THIS CODE:
npm install the packages express and require needed by the server side.
In books.js:
	Add your Google API key in the variable googleAPIKey.
	Set the folder where your ebooks are stored in the variable booksFolder.

Because of the way this is using Google APIs at the moment, it will show 1000 books maximum if you have a free Google API account.

Server side (Node.js)
rest_server.js is written using Node.js and creates a rest API for the client side to query books. 
books.js is the class that reads the list of ebooks from the local filesystem and queries Google Books API for each one. It returns a list of books with the information from the Google API, in JSON format.

/public --> client side code (Backbone)
books.html is the html and template used by backbone to display the books.
/src/app.js code to fetch and display the books information.

