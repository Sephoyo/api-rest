const express = require('express');
const authorizeRoles = require('../middleware/role.middleware');

const ProductRoute = (db, authenticateToken) => {
    const router = express.Router();

    //Get all products
    router.get('/', (req, res) => {
        const products = db.prepare('SELECT * FROM PRODUCT').all();
        return res.status(200).json(products);
    });

    //Get one product by id
    router.get('/:id', (req, res) => {
        const product = db.prepare('SELECT * FROM PRODUCT WHERE id=?').get(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json(product);
    });

    //Add product
    router.post('/', authenticateToken, authorizeRoles('manager', 'admin'), (req, res) => {
        const { nom, desc, price, categorie } = req.body;

        if (!nom || !desc || !price || !categorie) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const stmt = db.prepare("INSERT into PRODUCT (nom,desc,price,categorie,created_by) VALUES (@nom,@desc,@price,@categorie,@created_by)")
        const result = stmt.run({
            nom: nom,
            desc: desc,
            price: price,
            categorie: categorie,
            created_by: req.user.id,
        });

        return res.status(201).json({
            id: result.lastInsertRowid,
            message: 'Product created successfully'
        });
    });

    //Patch product
    router.patch('/:id', authenticateToken, authorizeRoles('manager', 'admin'), (req,res)=>{
        const existingProduct = db.prepare('SELECT * FROM PRODUCT WHERE id=?').get(req.params.id);

        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        //Un manager ne peut modifier que ses propres produits
        if (req.user.role === 'manager' && existingProduct.created_by !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
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
    router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req,res)=>{
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

    return router;
};

module.exports = ProductRoute;
