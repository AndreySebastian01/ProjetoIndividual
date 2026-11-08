var express = require("express");
var router = express.Router();

var dashboardController = require("../controllers/dashboardController");

router.get("/top-personagens", function (req, res) {
    dashboardController.personagensFrequentes(req, res);
});

module.exports = router;
