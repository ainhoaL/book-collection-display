var request = require('request');
var fs = require('fs');

var booksFolder = '../kindleBooks';
var booksPerPage = 14;
var googleAPIKey = '';
var volumesURL = 'https://www.googleapis.com/books/v1/volumes?q=';

// Goes through the files in the booksFolder and according to the booksPerPage gets the information for those books
// using Google Books API.
function findGoogleBooksByPage(req, res, page) {

    fs.readdir(booksFolder, function (error, files) {
        if (error) {
            //return error - failed at opening the folder
            res.statusCode = 400;
            res.send('Failed to find/open books folder: ' + error.path);
        } else {
            if (files.length > 0) {
                var listOfBooks = [];
                var booksLeft = files.length - (page - 1) * booksPerPage;
				var numberOfResponses = 0;
                var numberOfRequests = booksPerPage;
				if(booksPerPage > booksLeft) {
					numberOfRequests = booksLeft;
				}
                
				// Call the Google Books API for a certain title + author
                var getBookFromGoogle = function (title, author, series) {
                    var requestURL = volumesURL + title + '+inauthor:' + author + '&key=' + googleAPIKey;
                    request(requestURL, function (error, response, body) {
                        numberOfResponses++;
                        if (!error && response.statusCode == 200) {
							//Return books json (if all calls for books per page or books left in the file system have been returned)
							//Otherwise store the book in the listOfBooks array
                            var data = JSON.parse(body);
                            if (data.items && data.items.length > 0) {
                                var selectedBook = checkBooks(data.items, title, author, series);
                                if (numberOfResponses == numberOfRequests) {
                                    listOfBooks.push(selectedBook);
                                    res.send(listOfBooks);
                                } else {
                                    listOfBooks.push(selectedBook);
                                }
                            }
                        } else {
                            res.statusCode = response.statusCode;
                            if (response.statusCode == 403) {
                                res.send('Google API Forbidden - credentials error or exceeded quota (1000 queries a day)');
                            } else {
                                res.send('Google API request failed, book: ' + title);
                            }
                        }
                    });
                };

				if (booksLeft <= 0) {
					res.send([]);
				}
				else {
					//Go through the books in the file system according to the page the client is in
					//Get the info for each book using the Google Books API
					for (var i = (page - 1) * booksPerPage; (i < page * booksPerPage && i < files.length); i++) {
						var fileName = files[i].split(' - ');
						var author = fileName[0];
						var bookTitle;
						var series = '';
						if (fileName.length > 2) {
							bookTitle = fileName[2].split('.');
							series = fileName[1];
						} else {
							bookTitle = fileName[1].split('.');
						}
						getBookFromGoogle(bookTitle[0], author, series);
					}
				}
				
            } else {
                res.statusCode = 404;
                res.send('No books in your collection');
            }
        }
    });
}

// Each call to the Google Books API returns an array of matches, choose the
// most appropiate one (the one that contains most accurate information and more details)
// User a points system and return the book with most points, that should be the best match for 
// the book in the file system
function checkBooks(books, title, author, series) {
    for (var i = 0; i < books.length; i++) {
        var book = books[i];
        book.points = 0;
        if (book.volumeInfo.imageLinks) {
            book.points += 2;
        }
        if (book.volumeInfo.pageCount) {
            book.points++;
        }
        if (book.volumeInfo.averageRating) {
            book.points += 2;
        }
        if (book.volumeInfo.description) {
            book.points += 2;
        }
        if (book.volumeInfo.categories) {
            book.points++;
        }
		//Title should be same as the book in the file system
        if (book.volumeInfo.title.toLowerCase() != title.toLowerCase()) {
            book.points = 0;
        }
    }
    var maxPoints = 0;
    var bookIndex = 0;
    for (var i = 0; i < books.length; i++) {
        if (books[i].points > maxPoints) {
            bookIndex = i;
            maxPoints = books[i].points;
        }
    }

    var selectedBook;
    if (maxPoints == 0) {
		//All the matches scored 0 points, return basic information
        selectedBook = {
            'volumeInfo': {
                'title': title,
                'authors': author,
                'series': series
            }
        };
    } else {
        selectedBook = books[bookIndex];
        selectedBook.volumeInfo.authors = author;
        selectedBook.volumeInfo.series = series;
    }
    return selectedBook;
}

exports.findGoogleBooksByPage = findGoogleBooksByPage;