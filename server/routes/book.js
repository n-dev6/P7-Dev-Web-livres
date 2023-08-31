const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require("../middleware/multer-config")


const booksCtrl = require('../controllers/book');

router.get('/',booksCtrl.getAllBooks);
router.post('/',auth, multer, booksCtrl.createBook);
router.get("/:id", booksCtrl.getOneBook);
// router.get("/bestrating", booksCtrl.getBestRating);
router.post("/:id/rating", auth, booksCtrl.setBookRating);
router.put('/:id', auth, booksCtrl.modifyBook);
router.delete('/:id', auth, booksCtrl.deleteBook);

module.exports = router;