var database = require("../database/config");

function listar() {
    return database.executar(`
        SELECT id_personagem, nome, imagem_url, lado, tagline, biografia, justificativa,
               abertura, conscienciosidade, extroversao, amabilidade, neuroticismo
        FROM personagem
        ORDER BY id_personagem ASC
        LIMIT 20;
    `);
}

function buscarPorId(id) {
    return database.executar(`
        SELECT id_personagem, nome, imagem_url, lado, tagline, biografia, justificativa,
               abertura, conscienciosidade, extroversao, amabilidade, neuroticismo
        FROM personagem
        WHERE id_personagem = ?;
    `, [id]);
}

module.exports = {
    listar,
    buscarPorId
};
