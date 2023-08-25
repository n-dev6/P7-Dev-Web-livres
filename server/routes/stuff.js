const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();


const stuffCtrl = require('../controllers/stuff');

router.get('/', auth, stuffCtrl.getAllStuff);
router.post('/',auth, stuffCtrl.createBook);
router.get('/:id', auth, stuffCtrl.getOneBook);
router.put('/:id', auth, stuffCtrl.modifyBook);
router.delete('/:id', auth, stuffCtrl.deleteBook);

module.exports = router;