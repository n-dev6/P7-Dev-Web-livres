  const Book = require("../models/Book");

exports.createBook = (req, res, next) => {
	const bookObject = JSON.parse(req.body.book);
	delete bookObject._id;
	delete bookObject._userId;
	const book = new Book({
		...bookObject,
		userId: req.auth.userId,
		imageUrl: `${req.protocol}://${req.get("host")}/images/${
			req.file.filename
		}`,
	});

	book
		.save()
		.then(() => res.status(201).json({ message: "Livre enregistré !" }))
		.catch((error) => res.status(404).json({ error }));
};

exports.setBookRating = async (req, res, next) => {
  const { userId, rating } = req.body;
  const bookId = req.params.id;

  // Vérifiez si le rating est entre 0 et 5
  if (rating < 0 || rating > 5) {
    return res.status(400).json({ error: 'Le rating doit être entre 0 et 5.' });
  }

  try {
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ error: 'Livre non trouvé.' });
    }

    // Vérifiez si l'utilisateur a déjà noté ce livre
    const userRating = book.ratings.find((rating) => rating.userId === userId);

    if (userRating) {
      return res.status(400).json({ error: 'L\'utilisateur a déjà noté ce livre.' });
    }

    // Ajoutez la nouvelle note à la liste des ratings
    book.ratings.push({ userId, grade: rating });

    // Mettez à jour la moyenne des notes (averageRating)
    const totalRatings = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
    book.averageRating = totalRatings / book.ratings.length;

    // Sauvegardez les modifications
    await book.save();

    res.status(200).json({ message: 'Note définie avec succès.', book });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la définition de la note.' });
  }
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({
    _id: req.params.id
  }).then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifyBook = (req, res, next) => {
  const book = new Book({
    _id: req.params.id,
    title: req.body.title,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    price: req.body.price,
    userId: req.body.userId
  });
  
  Book.updateOne({_id: req.params.id}, book).then(
    () => {
      res.status(201).json({
        message: 'book updated successfully!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.deleteBook = (req, res, next) => {
  Book.deleteOne({_id: req.params.id}).then(
    () => {
      res.status(200).json({
        message: 'Deleted!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.getAllBooks = (req, res, next) => {
	Book.find()
		.then((books) => res.status(200).json(books))
		.catch((error) => res.status(404).json({ error }));
};
