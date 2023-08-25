const express = require('express');
const app = express();
const stuffRoutes = require('./routes/stuff')
const userRoutes = require('./routes/user')
const mongoose = require('mongoose');
  
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Ajout du middleware express.json() pour analyser le corps des requêtes POST en JSON
app.use(express.json());

mongoose.connect('mongodb+srv://norybrakhlia:j1deS0ej8NeFA1YF@p7dev.a3szkt5.mongodb.net/?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));
  

app.use('/api/books', stuffRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;
