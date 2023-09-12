// Importez le modèle Book (assurez-vous que le chemin est correct)
const Book = require("../models/Book");
const fs = require('fs'); // Module pour gérer les fichiers sur le système de fichiers
const sharp = require('sharp'); // Module pour manipuler les images
const { optimizeImage } = require("../helpers/imageHelper");


// Route pour créer un nouveau livre
exports.createBook = (req, res, next) => {
    console.log(req.body);

    // Analysez les données du livre à partir de la demande
    const bookObject = JSON.parse(req.body.book);

    // Supprimez certaines propriétés indésirables si elles existent
    delete bookObject._id;
    delete bookObject._userId;

    const outputFilename = req.file.filename + ".webp";
    const outputPath = `images/${outputFilename}`;
    // Créez une nouvelle instance de livre avec les données de la demande
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId, // Attribuez l'ID de l'utilisateur actuel au livre
        imageUrl: `${req.protocol}://${req.get("host")}/images/${outputFilename}`, // URL de l'image du livre
    });


    // Construction du chemin d'accès de l'image optimisée


    // Optimisation de l'image
    const inputPath = req.file.path;
    optimizeImage(inputPath, outputPath)
        .then(() => {
            // Suppression de l'image originale après sa conversion
            fs.unlink(inputPath, (err) => {
                if (err) {
                    console.error(
                        "Erreur lors de la suppression de l'image originale:",
                        err
                    );
                    return res
                        .status(500)
                        .json({ error: "Failed to delete the original image" });
                } // Sauvegarde du livre dans la base de données
                book
                    .save()
                    .then(() =>
                        res.status(201).json({ message: "Livre enregistré !" })
                    )
                    .catch((error) => res.status(400).json({ error }));
            });
        })
        .catch((error) => res.status(500).json({ error: "Database error" }));
};

// Route pour obtenir un livre par son ID
exports.getOneBook = (req, res, next) => {
    Book.findOne({
        _id: req.params.id
    })
        .then(
            (book) => {
                res.status(200).json(book);
            }
        )
        .catch(
            (error) => {
                res.status(404).json({
                    error: error
                });
            }
        );
};

// Route pour définir la note d'un livre par son ID
exports.setBookRating = async (req, res, next) => {
    const { userId, rating } = req.body;
    const bookId = req.params.id;

    try {
        if (rating < 0 || rating > 5) {
            return res.status(400).json({ error: 'Le rating doit être entre 0 et 5.' });
        }

        // Recherchez le livre par son ID
        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé.' });
        }

        // Vérifiez si l'utilisateur a déjà noté ce livre
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


// Route pour supprimer un livre par son ID
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};
exports.updateBook = (req, res, next) => {
    // Utilisation de 'findOne()' pour rechercher le livre ayant le même '_id' que le paramètre de la requête
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            // Vérifiez si l'utilisateur actuel est l'auteur du livre en comparant 'userId' du livre avec 'req.auth.userId'
            if (book.userId != req.auth.userId) {
                // Si l'utilisateur n'est pas l'auteur, renvoyez une réponse d'erreur 401 (Non autorisé)
                res.status(401).json({ message: "Vous n'avez pas l'autorisation requise." })
            } else {
                var bookObject = { ...req.body };
                //TODO : Enregistrer l'ancienne IMG
                const oldBookImageUrl = book.imageUrl;
                // Si une image a été téléchargée
                if (req.file) {
                    const outputFilename = req.file.filename + ".webp";
                    const outputPath = `images/${outputFilename}`;

                    optimizeImage(req.file.path, outputPath)
                        .then(() => {
                            // Suppression de l'image originale après sa conversion
                            fs.unlink(req.file.path, (err) => {
                                if (err) {
                                    console.error(
                                        "Erreur lors de la suppression de l'image originale:",
                                        err
                                    );
                                    return res
                                        .status(500)
                                        .json({ error: "Failed to delete the original image" });
                                } // Sauvegarde du livre dans la base de données
                            });

                            bookObject = {
                                ...JSON.parse(req.body.book), // Si une image est téléchargée, parsez les données du livre depuis 'req.body.book'
                                imageUrl: `${req.protocol}://${req.get('host')}/images/${outputFilename}` // Ajoutez l'URL de l'image
                            };

                            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                            .then(() => res.status(200).json({ message: 'Votre livre a bien été modifié !' }))
                            .catch(error => res.status(401).json({ error })); // Gérez les erreurs liées à la mise à jour

                            // TODO : Supprimer l'ancienne (oldBookImageUrl)                           
                        });
                }else{
                    Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Votre livre a bien été modifié !' }))
                    .catch(error => res.status(401).json({ error })); // Gérez les erreurs liées à la mise à jour
                }
            }
        })
        .catch(error => res.status(400).json({ error })); // Gérez les erreurs liées à la recherche du livre

};


// Route pour obtenir les livres les mieux notés
exports.getBestRatedBooks = async (req, res, next) => {
    try {
        // Recherchez les livres avec une note moyenne valide
        const bestRatedBooks = await Book.find({
            averageRating: { $exists: true, $ne: null }
        })
            .sort({ averageRating: -1 }) // Triez par ordre décroissant de la note moyenne
            .limit(3); // Limitez les résultats aux 3 premiers livres avec la meilleure note moyenne

        res.status(200).json(bestRatedBooks);
        console.log(bestRatedBooks);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des livres les mieux notés.' });
    }
};

// Route pour obtenir tous les livres
exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(404).json({ error }));
};
