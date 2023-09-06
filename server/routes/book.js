const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require("../middleware/multer-config")


const booksCtrl = require('../controllers/book');

router.get("/bestrating", booksCtrl.getBestRatedBooks);

router.get('/',booksCtrl.getAllBooks);

router.post('/',auth, multer, booksCtrl.createBook);

router.get("/:id", booksCtrl.getOneBook);
router.post("/:id/rating", auth, booksCtrl.setBookRating);
router.put('/:id', auth, multer, booksCtrl.updateBook);
router.delete('/:id', auth, booksCtrl.deleteBook);

module.exports = router;