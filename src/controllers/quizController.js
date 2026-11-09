var quizModel = require("../models/quizModel");
var personagemModel = require("../models/personagemModel");

var DIMENSOES = ["abertura", "conscienciosidade", "extroversao", "amabilidade", "neuroticismo"];
var VALORES_VALIDOS = [-2, 0, 2];

function pegarEmail(body) {
    return body.email !== undefined ? body.email : body.emailServer;
}

function emailValido(email) {
    return typeof email === "string"
        && email.length <= 254
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function extrairPontuacoes(body) {
    var lista = body.pontuacoes !== undefined
        ? body.pontuacoes
        : (body.respostas !== undefined ? body.respostas : body.pontuacoesServer);

    if (!Array.isArray(lista) || lista.length !== DIMENSOES.length) {
        return null;
    }

    var dimensoes = {};
    for (var i = 0; i < DIMENSOES.length; i++) {
        var item = lista[i];
        var valor = item && typeof item === "object"
            ? (item.valor !== undefined ? item.valor : item.resposta)
            : item;

        if (!VALORES_VALIDOS.includes(valor)) {
            return null;
        }
        dimensoes[DIMENSOES[i]] = valor;
    }
    return dimensoes;
}

function calcularCompatibilidade(perfil, personagem) {
    var distanciaQuadrada = DIMENSOES.reduce(function (total, dim) {
        var diferenca = perfil[dim] - Number(personagem[dim]);
        return total + diferenca * diferenca;
    }, 0);

    // 80 = distância máxima possível (5 dimensões x diferença 4 ao quadrado)
    var compatibilidade = 100 * (1 - Math.sqrt(distanciaQuadrada) / Math.sqrt(80));
    return Math.round(Math.max(0, Math.min(100, compatibilidade)));
}

function contarIguais(perfil, personagem) {
    return DIMENSOES.filter(function (dim) {
        return Number(personagem[dim]) === perfil[dim];
    }).length;
}

function ehMelhor(a, b) {
    if (a.compatibilidade !== b.compatibilidade) return a.compatibilidade > b.compatibilidade;
    if (a.iguais !== b.iguais) return a.iguais > b.iguais;
    return a.personagem.id_personagem < b.personagem.id_personagem;
}

function escolherMelhor(perfil, personagens) {
    var melhor = null;

    personagens.forEach(function (personagem) {
        var candidato = {
            personagem: personagem,
            compatibilidade: calcularCompatibilidade(perfil, personagem),
            iguais: contarIguais(perfil, personagem)
        };
        if (melhor === null || ehMelhor(candidato, melhor)) {
            melhor = candidato;
        }
    });

    return melhor;
}

function validarEmail(req, res) {
    var email = pegarEmail(req.body);

    if (!emailValido(email)) {
        return res.status(400).json({ erro: "Formato de e-mail inválido." });
    }

    res.status(200).json({ valido: true, email: email.trim().toLowerCase() });
}

async function finalizar(req, res) {
    var email = pegarEmail(req.body);
    if (!emailValido(email)) {
        return res.status(400).json({ erro: "Formato de e-mail inválido." });
    }

    var dimensoes = extrairPontuacoes(req.body);
    if (!dimensoes) {
        return res.status(400).json({
            erro: "É necessário informar exatamente cinco pontuações válidas (-2, 0 ou 2)."
        });
    }

    try {
        var personagens = await personagemModel.listar();
        if (!Array.isArray(personagens) || personagens.length === 0) {
            throw { status: 409, message: "Nenhum personagem cadastrado." };
        }

        var melhor = escolherMelhor(dimensoes, personagens);

        email = email.trim().toLowerCase();
        var usuarios = await quizModel.buscarUsuarioPorEmail(email);
        var idUsuario = usuarios.length > 0
            ? usuarios[0].id_usuario
            : (await quizModel.cadastrarUsuario(email)).insertId;

        var resultado = await quizModel.inserirResultado(
            idUsuario,
            melhor.personagem.id_personagem,
            melhor.compatibilidade,
            dimensoes
        );

        res.status(201).json({
            id_resultado: resultado.insertId,
            personagem: melhor.personagem,
            compatibilidade: melhor.compatibilidade,
            dimensoes: dimensoes,
            pontuacoes: dimensoes,
            envio_email_solicitado: false
        });
    } catch (erro) {
        console.log(erro);
        if (erro.status) {
            res.status(erro.status).json({ erro: erro.message });
        } else {
            res.status(500).json({ erro: erro.sqlMessage || "Erro ao finalizar o quiz." });
        }
    }
}

module.exports = {
    validarEmail,
    finalizar
};