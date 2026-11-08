var personagemModel = require("../models/personagemModel");

function listar(req, res) {
    personagemModel.listar()
        .then(function (personagens) {
            res.status(200).json(personagens);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: erro.sqlMessage || "Erro ao consultar personagens." });
        });
}

function buscarPorId(req, res) {
    var id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ erro: "ID de personagem inválido." });
        return;
    }

    personagemModel.buscarPorId(id)
        .then(function (personagens) {
            if (personagens.length === 0) {
                res.status(404).json({ erro: "Personagem não encontrado." });
                return;
            }
            res.status(200).json(personagens[0]);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: erro.sqlMessage || "Erro ao consultar personagem." });
        });
}

module.exports = {
    listar,
    buscarPorId
};
