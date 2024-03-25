const express = require("express");
const router = express.Router();

router.patch('/vote/', (req, res) => {

})

router.patch('/open/:id', (req, res) => {
    
})

router.patch('/close/:id', (req, res) => {
    
})

router.post('/', (req, res) => {
    
})

router.get('/:id', (req, res) => {
    const id = req.params.id;
    res.send("Get user " + id);
})

module.exports = router;