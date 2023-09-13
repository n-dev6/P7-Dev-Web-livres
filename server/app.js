const express = require('express');
const app = express();
const bodyParser = require('body-parser'); // Importez bodyParser
const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');
const path = require('path');
const mongoose = require('mongoose');

  // Configuration des en-têtes CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Utilisez bodyParser.json() ici, avant de définir les routes
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://norybrakhlia:j1deS0ej8NeFA1YF@p7dev.a3szkt5.mongodb.net/?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

// Utilisation des routes pour les livres, les utilisateurs et la gestion des images
app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;
