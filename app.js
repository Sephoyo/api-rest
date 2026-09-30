const express = require('express');
const app = express();
const Database = require('better-sqlite3');
const port = 3000;

app.use(express.json());// for parsing application/json
app.use(express.urlencoded({ extended: true }));// for parsing application/x-www-form-urlencoded


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

app.get('/', (req, res) => {
    res.send(1);
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
app.post('/products/', (req, res) => {
    const stmt = db.prepare("INSERT into PRODUCT (nom,desc,price,categorie) VALUES (@nom,@desc,@price,@categorie)")
    const result = stmt.run({
        nom: req.body.nom,
        desc: req.body.desc,
        price: req.body.price,
        categorie: req.body.categorie,
    });
    res.status(201).send()
})

//Patch product
app.patch('/products/:id', (req,res)=>{
    const stmt = db.prepare("UPDATE PRODUCT SET nom=@nom, desc=@desc, price=@price, categorie=@categorie WHERE id=@id")
    const result = stmt.run({
        nom: req.body.nom,
        desc: req.body.desc,
        price: req.body.price,
        categorie: req.body.categorie,
        id: req.params.id,
    });
    res.send(result)
})

//Delete product
app.delete('/products/:id', (req,res)=>{
    const stmt = db.prepare("DELETE FROM PRODUCT WHERE id=?")
    const result = stmt.run(req.params.id)
    res.send(result)
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});