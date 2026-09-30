const express = require('express');
const app = express();
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
//middleware authentification
const createAuthenticateToken = require('./middleware/login.middleware');

app.use(express.json());// for parsing application/json
app.use(express.urlencoded({ extended: true }));// for parsing application/x-www-form-urlencoded

//Normalement secret dans un .env
const SECRET_KEY = 'cest_une_cle';
const port = 3000;
const authenticateToken = createAuthenticateToken(SECRET_KEY);


const db = new Database('local.db');

// Création d'une table d'exemple au démarrage
db.exec(`
  CREATE TABLE IF NOT EXISTS PRODUCT (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    desc TEXT NOT NULL,
    price INTEGER NOT NULL,
    categorie TEXT NOT NULL

  )
`);

db.exec(`
  INSERT INTO PRODUCT (nom, desc, price, categorie) VALUES
    ('Clavier mécanique', 'Clavier mécanique sans fil', 7999, 'Informatique'),
    ('Souris ergonomique', 'Souris sans fil avec capteur optique', 2999, 'Informatique'),
    ('Casque audio', 'Casque audio Bluetooth', 5999, 'Audio'),
    ('Sac à dos', 'Sac à dos imperméable pour ordinateur', 4499, 'Accessoires'),
    ('Gourde inox', 'Gourde réutilisable de 750 ml', 1999, 'Maison');
`);

//Création de la table utilisateur
db.exec(`
  CREATE TABLE IF NOT EXISTS USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    email TEXT NOT NULL,
    password INTEGER NOT NULL
  )
`);

db.exec(`
  INSERT INTO USERS (nom, email, password) VALUES
    ('Joe', 'joe@doe.fr','password123');
`);


app.get('/', (req, res) => {
    res.send(1);
});

//Login user
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM USERS WHERE email=? AND password=?').get(email, password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username: user.nom }, SECRET_KEY, { expiresIn: '5m' });
    return res.json({ token });
});


//Get all products
app.get('/products/', (req, res) => {
    const stmt = db.prepare('SELECT * FROM PRODUCT');
    res.send(stmt.all())
})

//Get on product by id
app.get('/products/:id', (req, res) => {
    const stmt = db.prepare('SELECT * FROM PRODUCT WHERE id=?').get(req.params.id)
    res.send(stmt)
})

//Add product
app.post('/products/', authenticateToken, (req, res) => {
    const { nom, desc, price, categorie } = req.body;
    const stmt = db.prepare("INSERT into PRODUCT (nom,desc,price,categorie) VALUES (@nom,@desc,@price,@categorie)")
    const result = stmt.run({
        nom: nom,
        desc: desc,
        price: price,
        categorie: categorie,
    });
    res.status(201).send()
})

//Patch product
app.patch('/products/:id', authenticateToken, (req,res)=>{
    const { nom, desc, price, categorie } = req.body;
    const stmt = db.prepare("UPDATE PRODUCT SET nom=@nom, desc=@desc, price=@price, categorie=@categorie WHERE id=@id")
    const result = stmt.run({
        nom: nom,
        desc: desc,
        price: price,
        categorie: categorie,
        id: req.params.id,
    });
    res.send(result)
})

//Delete product
app.delete('/products/:id', authenticateToken, (req,res)=>{
    const stmt = db.prepare("DELETE FROM PRODUCT WHERE id=?")
    const result = stmt.run(req.params.id)
    res.send(result)
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});