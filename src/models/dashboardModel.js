var database = require("../database/config");

function buscarPersonagensFrequentes() {
    return database.executar(`
        SELECT p.id_personagem, p.nome, p.imagem_url,
               COUNT(r.id_resultado) AS quantidade
        FROM resultado r
        JOIN personagem p ON p.id_personagem = r.id_personagem
        GROUP BY p.id_personagem, p.nome, p.imagem_url
        ORDER BY quantidade DESC, p.id_personagem ASC
        LIMIT 5;
    `);
}

module.exports = {
    buscarPersonagensFrequentes
};
