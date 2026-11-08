var dashboardModel = require("../models/dashboardModel");

function personagensFrequentes(req, res) {
    dashboardModel.buscarPersonagensFrequentes()
        .then(function (personagens) {
            res.status(200).json(personagens);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: erro.sqlMessage || "Erro ao consultar personagens frequentes." });
        });
}

module.exports = {
    personagensFrequentes
};
