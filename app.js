require('dotenv').config();
const express = require('express');
const app = express();
const Database = require('better-sqlite3');
//middleware authentification
const createAuthenticateToken = require('./middleware/login.middleware');
//routes
const UserRoute = require('./routes/users.routes');
const ProductRoute = require('./routes/products.routes');

app.use(express.json());// for parsing application/json
app.use(express.urlencoded({ extended: true }));// for parsing application/x-www-form-urlencoded

//Secret récupéré depuis le .env
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    throw new Error('SECRET_KEY manquante : copier .env.example en .env et la renseigner');
}
const port = process.env.PORT || 3000;
const authenticateToken = createAuthenticateToken(SECRET_KEY);


const db = new Database('local.db');

//Création des produits fictifs
db.exec(`
  CREATE TABLE IF NOT EXISTS PRODUCT (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    desc TEXT NOT NULL,
    price INTEGER NOT NULL,
    categorie TEXT NOT NULL
  )
`);

if (db.prepare("SELECT COUNT(*) AS n FROM PRODUCT").get().n === 0){
    db.exec(`
        INSERT INTO PRODUCT (nom, desc, price, categorie) VALUES
            ('Clavier mécanique', 'Clavier mécanique sans fil', 7999, 'Informatique'),
            ('Souris ergonomique', 'Souris sans fil avec capteur optique', 2999, 'Informatique'),
            ('Casque audio', 'Casque audio Bluetooth', 5999, 'Audio'),
            ('Sac à dos', 'Sac à dos imperméable pour ordinateur', 4499, 'Accessoires'),
            ('Gourde inox', 'Gourde réutilisable de 750 ml', 1999, 'Maison');
        `);
}

//Création de la table utilisateur
db.exec(`
  CREATE TABLE IF NOT EXISTS USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    email TEXT NOT NULL,
    password INTEGER NOT NULL
  )
`);

if (db.prepare("SELECT COUNT(*) AS n FROM USERS").get().n === 0){
    db.exec(`
    INSERT INTO USERS (nom, email, password) VALUES
        ('John', 'john@doe.fr','password123');
    `);
}


app.get('/', (req, res) => {
    res.status(200).json({ message: 'API disponible' });
});

app.use('/', UserRoute(db, SECRET_KEY));
app.use('/products', ProductRoute(db, authenticateToken));

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});