var app = {}; 

app.Book = Backbone.Model.extend({
    url: 'http://localhost:8888/books',
    defaults: {
        title: '',
        author: '',
        series: '',
        img: '',
        description: '',
        pages: null,
        rating: null,
        genre: ''
    }
});

app.BookList = Backbone.Collection.extend({
    model: app.Book,
    url: 'http://localhost:8888/books',
    page: 0,
	keepFetching: true,

    parse: function (response) {

        for (var i = 0; i < response.length; i++) {
            var restBook = response[i];
            var book = {};
            book.link = restBook.volumeInfo.infoLink;
            book.title = restBook.volumeInfo.title;
            book.author = restBook.volumeInfo.authors;
            if (restBook.volumeInfo.imageLinks) {
                book.img = restBook.volumeInfo.imageLinks.thumbnail;
            }
            if (restBook.volumeInfo.pageCount) {
                book.pages = restBook.volumeInfo.pageCount;
            }
            if (restBook.volumeInfo.averageRating) {
                book.rating = restBook.volumeInfo.averageRating;
            }
            if (restBook.volumeInfo.description) {
                if (restBook.volumeInfo.description.length > 200) {
                    book.description = restBook.volumeInfo.description.substring(0, 200) + '...';
                } else {
                    book.description = restBook.volumeInfo.description;
                }
            }
            if (restBook.volumeInfo.categories) {
                book.genre = restBook.volumeInfo.categories;
            }
            if (restBook.volumeInfo.series) {
                book.series = restBook.volumeInfo.series;
            }
            this.push(book);
        }
        return this.models;
    },

    comparator: function (book) {
        return (book.get('author') + book.get('series') + book.get('title'));
    },

    initialize: function () {}
});

// instance of the Collection
app.bookList = new app.BookList();

// renders individual todo items list (li)
app.BookView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#item-template').html()),
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this; // enable chained calls
    },
    initialize: function () {},
    destroy: function () {
        this.model.destroy();
    }
});

// renders the full list of todo items calling TodoView for each one.
app.AppView = Backbone.View.extend({
    el: '#booksapp',
    initialize: function () {
        this.loading = false;
        app.bookList.on('reset', this.addAll, this);
        var that = this;
        $('#main').bind('scroll', function () {
            var triggerPoint = 100; // 100px from the bottom
            if (!that.loading && $('#main')[0].scrollTop + $('#main')[0].clientHeight + triggerPoint > $('#main')[0].scrollHeight) {
                app.router.index();
            }
        });
    },
    addOne: function (book) {
        var view = new app.BookView({
            model: book
        });
        $('#booklist').append(view.render().el);
    },
    addAll: function () {
        this.loading = true;
        this.$('#booklist').html(''); // clean the list
        switch (window.filter) {
            default: app.bookList.each(this.addOne, this);
            break;
        }
        this.loading = false;
        $('#loadingText').hide();
    }
});

app.Router = Backbone.Router.extend({
    routes: {
        '': 'index'
    },

    index: function () {
        app.bookList.page++;

        app.bookList.url = 'books/' + app.bookList.page;
		if(app.bookList.keepFetching){
		    $('#loadingText').show();
			app.bookList.fetch({
				success: function (model, response, options) {
					$('#errorText').hide();
					console.log(response);
					if(response.length == 0) {
						//Ran out of books to display
						app.bookList.page--;
						app.bookList.keepFetching = false;
					}
					app.appView.addAll();
				},
				error: function (model, xhr, options) {
					$('#loadingText').hide();
					$('#errorText').show();
					$('#errorText').text(xhr.responseText);
				}
			});
		}
        
    }
});

//--------------
// Initializers
//--------------   
app.router = new app.Router();
Backbone.history.start();
app.appView = new app.AppView();