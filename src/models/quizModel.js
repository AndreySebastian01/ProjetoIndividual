var database = require("../database/config");

function buscarUsuarioPorEmail(email) {
    return database.executar(
        "SELECT id_usuario FROM usuario WHERE email = ? LIMIT 1;",
        [email]
    );
}

function cadastrarUsuario(email) {
    return database.executar(
        "INSERT INTO usuario (email) VALUES (?);",
        [email]
    );
}

function inserirResultado(idUsuario, idPersonagem, compatibilidade, dimensoes) {
    return database.executar(
        `INSERT INTO resultado
            (id_usuario, id_personagem, compatibilidade, abertura, conscienciosidade,
             extroversao, amabilidade, neuroticismo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
            idUsuario,
            idPersonagem,
            compatibilidade,
            dimensoes.abertura,
            dimensoes.conscienciosidade,
            dimensoes.extroversao,
            dimensoes.amabilidade,
            dimensoes.neuroticismo
        ]
    );
}

module.exports = {
    buscarUsuarioPorEmail,
    cadastrarUsuario,
    inserirResultado
};
