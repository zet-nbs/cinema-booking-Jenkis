const express = require("express");

const {

    getStudios,
    getStudioById,
    createStudio,
    updateStudio,
    deleteStudio

} = require("../controllers/studioController");


const router = express.Router();


router.get("/", getStudios);
router.get("/:id", getStudioById);
router.post("/", createStudio);
router.put("/:id", updateStudio);
router.delete("/:id", deleteStudio);

module.exports = router;