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
    res.status(200).json({ message: 'API disponible' });
});

//Login user
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM USERS WHERE email=? AND password=?').get(email, password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username: user.nom }, SECRET_KEY, { expiresIn: '5m' });
    return res.status(200).json({ token });
});


//Get all products
app.get('/products/', (req, res) => {
    const products = db.prepare('SELECT * FROM PRODUCT').all();
    return res.status(200).json(products);
});

//Get one product by id
app.get('/products/:id', (req, res) => {
    const product = db.prepare('SELECT * FROM PRODUCT WHERE id=?').get(req.params.id);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(product);
});

//Add product
app.post('/products/', authenticateToken, (req, res) => {
    const { nom, desc, price, categorie } = req.body;

    if (!nom || !desc || !price || !categorie) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const stmt = db.prepare("INSERT into PRODUCT (nom,desc,price,categorie) VALUES (@nom,@desc,@price,@categorie)")
    const result = stmt.run({
        nom: nom,
        desc: desc,
        price: price,
        categorie: categorie,
    });

    return res.status(201).json({
        id: result.lastInsertRowid,
        message: 'Product created successfully'
    });
});

//Patch product
app.patch('/products/:id', authenticateToken, (req,res)=>{
    const existingProduct = db.prepare('SELECT * FROM PRODUCT WHERE id=?').get(req.params.id);

    if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
    }

    const { nom, desc, price, categorie } = req.body;
    const updatedProduct = {
        nom: nom ?? existingProduct.nom,
        desc: desc ?? existingProduct.desc,
        price: price ?? existingProduct.price,
        categorie: categorie ?? existingProduct.categorie,
        id: Number(req.params.id),
    };

    const stmt = db.prepare("UPDATE PRODUCT SET nom=@nom, desc=@desc, price=@price, categorie=@categorie WHERE id=@id")
    stmt.run(updatedProduct);

    return res.status(200).json({
        message: 'Product updated successfully',
        product: updatedProduct
    });
});

//Delete product
app.delete('/products/:id', authenticateToken, (req,res)=>{
    const existingProduct = db.prepare('SELECT * FROM PRODUCT WHERE id=?').get(req.params.id);

    if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
    }

    const stmt = db.prepare("DELETE FROM PRODUCT WHERE id=?")
    stmt.run(req.params.id)

    return res.status(200).json({
        message: 'Product deleted successfully',
        id: Number(req.params.id)
    });
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});