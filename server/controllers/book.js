  const Book = require("../models/Book");
  const fs = require('fs');
  const sharp = require('sharp');


  exports.createBook = (req, res, next) => {
    console.log(req.body);
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
exports.setBookRating = async (req, res, next) => {
  const { userId, rating } = req.body;
  const bookId = req.params.id;

  try {
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Le rating doit être entre 0 et 5.' });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ error: 'Livre non trouvé.' });
    }

    const userRating = book.ratings.find((ratingObj) => ratingObj.userId === userId);

    if (userRating) {
      return res.status(400).json({ error: 'L\'utilisateur a déjà noté ce livre.' });
    }

    // Ajoutez la nouvelle note à la liste des ratings
    book.ratings.push({ userId, grade: rating });

    // Mettez à jour la moyenne des notes (averageRating)
    const totalRatings = book.ratings.reduce((sum, ratingObj) => sum + ratingObj.grade, 0);
    book.averageRating = totalRatings / book.ratings.length;

    // Sauvegardez les modifications
    await book.save();

    res.status(200).json({ message: 'Note définie avec succès.', book });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la définition de la note.' });
  }
};



exports.modifyBook = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    //erreur ici 
    const { title, description, imageUrl, price } = req.body;

    let updatedBook = {
      title,
      description,
      price,
    };

    // Vérifiez si une nouvelle image est envoyée
    //erreur ici 
    if (imageUrl) {
      // Utilisez Sharp pour optimiser la nouvelle image
      const optimizedImageBuffer = await sharp(imageUrl)
        .resize(800, 600) // Redimensionnez l'image selon vos besoins
        .jpeg({ quality: 80 }) // Définissez la qualité JPEG
        .toBuffer();

      // Supprimez l'ancienne image (si présente)
      const bookToUpdate = await Book.findById(bookId);
      if (bookToUpdate.imageUrl) {
        const oldImageUrl = bookToUpdate.imageUrl.split('/images/')[1];
        fs.unlinkSync(`images/${oldImageUrl}`);
      }

      // Enregistrez la nouvelle image optimisée
      const newImageFileName = `${Date.now()}.jpg`;
      fs.writeFileSync(`images/${newImageFileName}`, optimizedImageBuffer);

      updatedBook.imageUrl = `${req.protocol}://${req.get("host")}/images/${newImageFileName}`;
    }

    // Mettez à jour le livre dans la base de données
    Book.updateOne({ _id: bookId }, updatedBook)
      .then(() => {
        res.status(200).json({ message: 'Livre mis à jour avec succès !' });
      })
      .catch((error) => {
        res.status(400).json({ error: error });
      });
  } catch (error) {
    res.status(400).json({ error: 'Données invalides.' });
  }
};


exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getAllBooks = (req, res, next) => {
	Book.find()
		.then((books) => res.status(200).json(books))
		.catch((error) => res.status(404).json({ error }));
};
