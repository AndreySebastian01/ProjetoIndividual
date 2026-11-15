const dimensoes = [
    { chave: "abertura", codigo: "O", nome: "Abertura à experiência" },
    { chave: "conscienciosidade", codigo: "C", nome: "Conscienciosidade" },
    { chave: "extroversao", codigo: "E", nome: "Extroversão" },
    { chave: "amabilidade", codigo: "A", nome: "Amabilidade" },
    { chave: "neuroticismo", codigo: "N", nome: "Neuroticismo" }
];

const questionNumber = document.querySelector("#question-number");
const answeredPercent = document.querySelector("#answered-percent");
const progressSegments = document.querySelector("#progress-segments");
const quizContent = document.querySelector("#quiz-content");
const quizMessage = document.querySelector("#quiz-message");

// estado do quiz
let perguntas = [];
let respostasSelecionadas = {}; // { idDaPergunta: "A" | "B" | "C" | "D" }
let perguntaAtual = 0;
let quizFinalizado = false;
let requisicaoFinalizacaoEmAndamento = false;
let resultadoFinalizacao = null;

// ---------- Funções auxiliares ----------
function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function mostrarErro(mensagem, erro) {
    console.error(mensagem, erro);
    quizMessage.textContent = mensagem;
    quizMessage.hidden = false;
    quizContent.setAttribute("aria-busy", "false");
    quizContent.innerHTML = `
        <p class="question-label">NÃO FOI POSSÍVEL CARREGAR O QUIZ</p>
        <h1>Algo deu errado.</h1>
        <p class="question-context">Atualize a página para tentar novamente. Se o problema continuar, verifique se o servidor e o banco de dados estão disponíveis.</p>
    `;
}

// ---------- Validação dos dados ----------
function validarPerguntas(lista) {
    if (!Array.isArray(lista) || lista.length !== 10) {
        throw new Error("O arquivo de perguntas deve conter exatamente 10 perguntas.");
    }

    const idsUsados = [];
    const contagem = {};
    dimensoes.forEach((dimensao) => {
        contagem[dimensao.chave] = 0;
    });

    for (const pergunta of lista) {
        if (!Number.isInteger(pergunta.id) || idsUsados.includes(pergunta.id)) {
            throw new Error("Cada pergunta deve possuir um ID numérico único.");
        }
        idsUsados.push(pergunta.id);

        if (!(pergunta.dimensao in contagem)) {
            throw new Error(`A pergunta ${pergunta.id} possui uma dimensão inválida.`);
        }
        contagem[pergunta.dimensao]++;

        if (!Array.isArray(pergunta.respostas) || pergunta.respostas.length !== 4) {
            throw new Error(`A pergunta ${pergunta.id} deve ter quatro alternativas.`);
        }

        // Com 4 respostas, ter A, B, C e D garante que não há letras repetidas
        const letras = pergunta.respostas.map((resposta) => resposta.opcao);
        const temTodasAsLetras = ["A", "B", "C", "D"].every((letra) => letras.includes(letra));
        const respostasValidas = pergunta.respostas.every((resposta) => {
            return typeof resposta.resposta === "string" && (resposta.valor === 1 || resposta.valor === -1);
        });

        if (!temTodasAsLetras || !respostasValidas) {
            throw new Error(`A pergunta ${pergunta.id} possui uma alternativa inválida.`);
        }
    }

    for (const chave in contagem) {
        if (contagem[chave] !== 2) {
            throw new Error("O quiz deve ter exatamente duas perguntas para cada dimensão.");
        }
    }
}

// ---------- Carregamento ----------
async function carregarDados() {
    const respostaPerguntas = await fetch("../mock/quiz_star_wars_perguntas.json");
    if (!respostaPerguntas.ok) {
        throw new Error("Não foi possível carregar as perguntas do quiz.");
    }

    const dadosPerguntas = await respostaPerguntas.json();
    validarPerguntas(dadosPerguntas.perguntas);

    perguntas = dadosPerguntas.perguntas;

    quizContent.setAttribute("aria-busy", "false");
    renderizarPergunta();
}

// tela de perguntas
function atualizarProgresso() {
    const respondidas = Object.keys(respostasSelecionadas).length;
    const percentual = Math.round((respondidas / perguntas.length) * 100);
    const numeroAtual = String(perguntaAtual + 1).padStart(2, "0");

    questionNumber.textContent = `PERGUNTA ${numeroAtual} / ${perguntas.length}`;
    answeredPercent.textContent = `${percentual}% RESPONDIDO`;
    progressSegments.setAttribute("aria-valuenow", String(respondidas));
    progressSegments.setAttribute("aria-valuetext", `${respondidas} de ${perguntas.length} perguntas respondidas`);

    progressSegments.innerHTML = perguntas.map((pergunta, indice) => {
        let classe = "progress-segment";
        if (respostasSelecionadas[pergunta.id]) classe += " is-answered";
        else if (indice === perguntaAtual) classe += " is-current";
        return `<span class="${classe}" aria-hidden="true"></span>`;
    }).join("");
}

// Evita mostrar a pergunta duas vezes quando ela já é a última frase do contexto
function perguntaRepeteContexto(contexto, pergunta) {
    const limpar = (texto) => texto.toLowerCase().replace(/[.!?]+$/, "").trim();
    const ultimaFrase = contexto.trim().replace(/[.!?]+$/, "").split(/[.!?]\s+/).pop();
    return limpar(ultimaFrase) === limpar(pergunta);
}

function renderizarPergunta() {
    const pergunta = perguntas[perguntaAtual];
    const respostaAtual = respostasSelecionadas[pergunta.id];
    const ehUltima = perguntaAtual === perguntas.length - 1;

    const htmlPergunta = perguntaRepeteContexto(pergunta.contexto, pergunta.pergunta)
        ? ""
        : `<p class="question-prompt">${escaparHtml(pergunta.pergunta)}</p>`;

    const htmlAlternativas = pergunta.respostas.map((resposta) => `
        <button class="answer-option" type="button" data-option="${resposta.opcao}"
            aria-pressed="${resposta.opcao === respostaAtual}">
            <span class="answer-letter" aria-hidden="true">${resposta.opcao}</span>
            <span class="answer-text">${escaparHtml(resposta.resposta)}</span>
        </button>
    `).join("");

    atualizarProgresso();
    quizContent.innerHTML = `
        <p class="question-label">SELECIONE UMA ALTERNATIVA</p>
        <h1>${escaparHtml(pergunta.titulo)}</h1>
        <p class="question-context">${escaparHtml(pergunta.contexto)}</p>
        ${htmlPergunta}
        <div class="answer-list" role="group" aria-label="Alternativas">
            ${htmlAlternativas}
        </div>
        <nav class="quiz-nav" aria-label="Navegação do quiz">
            <button class="previous-button" type="button" ${perguntaAtual === 0 ? "hidden" : ""}>
                ← Pergunta anterior
            </button>
            <span class="keyboard-hint">ATALHOS 1–4</span>
            <button class="next-button" type="button" ${respostaAtual ? "" : "disabled"}>
                ${ehUltima ? "Ver resultado" : "Próxima pergunta"} →
            </button>
        </nav>
    `;

    quizContent.querySelectorAll(".answer-option").forEach((botao) => {
        botao.addEventListener("click", () => selecionarResposta(botao.dataset.option));
    });
    quizContent.querySelector(".previous-button").addEventListener("click", voltarPergunta);
    quizContent.querySelector(".next-button").addEventListener("click", avancarPergunta);
}

function selecionarResposta(opcao) {
    respostasSelecionadas[perguntas[perguntaAtual].id] = opcao;
    renderizarPergunta();
    quizContent.querySelector(`[data-option="${opcao}"]`).focus();
}

function voltarPergunta() {
    if (perguntaAtual > 0) {
        perguntaAtual--;
        renderizarPergunta();
    }
}

function avancarPergunta() {
    if (!respostasSelecionadas[perguntas[perguntaAtual].id]) return;

    if (perguntaAtual < perguntas.length - 1) {
        perguntaAtual++;
        renderizarPergunta();
    } else {
        finalizarQuiz();
    }
}

// calculo do resultado
// soma os valores (+1 / -1) das respostas escolhidas em cada dimensão
function calcularPerfil() {
    const perfil = {};
    dimensoes.forEach((dimensao) => {
        perfil[dimensao.chave] = 0;
    });

    for (const pergunta of perguntas) {
        const opcao = respostasSelecionadas[pergunta.id];
        const resposta = pergunta.respostas.find((item) => item.opcao === opcao);
        if (!resposta) throw new Error(`A pergunta ${pergunta.id} não foi respondida.`);
        perfil[pergunta.dimensao] += resposta.valor;
    }

    return perfil;
}

function validarResultadoFinalizacao(dados) {
    const pontuacoes = dados && dados.pontuacoes;
    const personagem = dados && dados.personagem;

    if (!dados || !Number.isInteger(Number(dados.id_resultado)) || Number(dados.id_resultado) < 1
        || !personagem || !Number.isInteger(Number(personagem.id_personagem)) || Number(personagem.id_personagem) < 1
        || typeof personagem.nome !== "string" || !personagem.nome.trim()
        || !Number.isInteger(Number(dados.compatibilidade))
        || Number(dados.compatibilidade) < 0 || Number(dados.compatibilidade) > 100
        || !pontuacoes || typeof pontuacoes !== "object") {
        throw new Error("O servidor retornou um resultado inválido para o quiz.");
    }

    dimensoes.forEach((dimensao) => {
        const pontuacao = pontuacoes[dimensao.chave];
        if (pontuacao === null || ![-2, 0, 2].includes(Number(pontuacao))) {
            throw new Error("O servidor retornou pontuações inválidas para o perfil.");
        }
        pontuacoes[dimensao.chave] = Number(pontuacao);
    });

    return dados;
}

async function lerRespostaApi(resposta, mensagemErro) {
    let dados;
    try {
        dados = await resposta.json();
    } catch (erro) {
        throw new Error(mensagemErro);
    }
    if (!resposta.ok) {
        throw new Error(dados.erro || mensagemErro);
    }
    return dados;
}

function mostrarErroFinalizacao(erro) {
    console.error("Não foi possível concluir e salvar o quiz.", erro);
    quizFinalizado = false;
    requisicaoFinalizacaoEmAndamento = false;
    quizMessage.textContent = `Não foi possível salvar seu resultado. ${erro.message} Tente novamente.`;
    quizMessage.hidden = false;
    quizContent.setAttribute("aria-busy", "false");
    renderizarPergunta();
}

async function finalizarQuiz() {
    if (requisicaoFinalizacaoEmAndamento) return;

    const email = sessionStorage.getItem("quizEmail");
    if (!email) {
        quizMessage.textContent = "Não foi possível identificar seu e-mail. Volte ao cadastro para iniciar o quiz.";
        quizMessage.hidden = false;
        return;
    }

    requisicaoFinalizacaoEmAndamento = true;
    quizFinalizado = true;
    quizContent.setAttribute("aria-busy", "true");
    quizContent.querySelectorAll("button").forEach((botao) => {
        botao.disabled = true;
    });
    quizMessage.textContent = "Salvando seu resultado...";
    quizMessage.hidden = false;

    try {
        if (!resultadoFinalizacao) {
            const perfil = calcularPerfil();
            const respostaFinalizacao = await fetch("/api/quiz/finalizar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    pontuacoes: dimensoes.map((dimensao) => perfil[dimensao.chave])
                })
            });
            const dadosFinalizacao = await lerRespostaApi(
                respostaFinalizacao,
                "Não foi possível salvar o resultado."
            );
            resultadoFinalizacao = validarResultadoFinalizacao(dadosFinalizacao);
        }

        sessionStorage.setItem("dashboardData", JSON.stringify({
            perfil: resultadoFinalizacao.pontuacoes,
            resultado: resultadoFinalizacao
        }));
        renderizarResultado(resultadoFinalizacao);
    } catch (erro) {
        mostrarErroFinalizacao(erro);
    } finally {
        requisicaoFinalizacaoEmAndamento = false;
    }
}

function criarGraficoRadar(canvas, valoresRadar) {
    new Chart(canvas, {
        type: "radar",
        data: {
            labels: dimensoes.map((dimensao) => [dimensao.codigo, dimensao.nome]),
            datasets: [{
                label: "Seu perfil",
                data: valoresRadar.map((dimensao) => dimensao.valor),
                backgroundColor: "rgba(244, 217, 0, 0.14)",
                borderColor: "#f4d900",
                borderWidth: 2,
                pointBackgroundColor: "#f4d900",
                pointBorderColor: "#080b13",
                pointHoverBackgroundColor: "#f1f2f5",
                pointHoverBorderColor: "#f4d900",
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.15,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (contexto) => `${dimensoes[contexto.dataIndex].nome}: ${contexto.raw}`
                    }
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 50,
                        color: "#a8afbd",
                        backdropColor: "transparent",
                        showLabelBackdrop: false
                    },
                    grid: { color: "#303744" },
                    angleLines: { color: "#3a424f" },
                    pointLabels: {
                        color: "#a8afbd",
                        font: { family: 'Consolas, "Courier New", monospace', size: 11 }
                    }
                }
            }
        }
    });
}

function renderizarResultado(dados) {
    const personagem = dados.personagem;
    const valoresRadar = dimensoes.map((dimensao) => ({
        ...dimensao,
        valor: Math.round(((dados.pontuacoes[dimensao.chave] + 2) / 4) * 100)
    }));
    const imagemUrl = personagem.imagem_url || personagem.imagemUrl;
    const tagline = personagem.tagline || personagem.descricao;
    const biografia = personagem.biografia || "";
    const justificativa = personagem.justificativa
        || Object.values(personagem.justificativas || {}).join(" ");
    const htmlImagem = imagemUrl
        ? `<img src="${escaparHtml(imagemUrl)}" alt="Retrato de ${escaparHtml(personagem.nome)}">`
        : `<p class="result-character-fallback">${escaparHtml(personagem.nome)}</p>`;

    quizMessage.hidden = true;
    questionNumber.textContent = "SEU RESULTADO";
    answeredPercent.textContent = `${dados.compatibilidade}% COMPATÍVEL`;
    progressSegments.setAttribute("aria-valuenow", String(perguntas.length));
    progressSegments.innerHTML = perguntas
        .map(() => '<span class="progress-segment is-answered" aria-hidden="true"></span>')
        .join("");

    quizContent.classList.add("result-content");
    quizContent.setAttribute("aria-busy", "false");
    quizContent.innerHTML = `
        <div class="result-layout">
            <div class="result-character" id="result-character">${htmlImagem}</div>
            <div class="result-summary">
                <p class="result-eyebrow">PERSONAGEM MAIS COMPATÍVEL</p>
                <h1>${escaparHtml(personagem.nome)}</h1>
                <p class="compatibility">${dados.compatibilidade}% DE COMPATIBILIDADE</p>
                ${tagline ? `<p class="result-tagline">${escaparHtml(tagline)}</p>` : ""}
                ${biografia ? `<p class="result-bio">${escaparHtml(biografia)}</p>` : ""}
                <p class="result-explanation">
                    Este resultado foi calculado com as pontuações das cinco dimensões do seu perfil.
                    A compatibilidade indica similaridade entre perfis, não uma probabilidade.
                </p>
                ${justificativa ? `<p class="result-justification">${escaparHtml(justificativa)}</p>` : ""}
            </div>
        </div>
        <section class="radar-section" aria-labelledby="radar-heading">
            <h2 id="radar-heading">Seu perfil</h2>
            <div class="radar-chart-container">
                <canvas id="profile-radar" role="img"></canvas>
            </div>
            <ul class="radar-legend">
                ${valoresRadar.map((dimensao) => `
                    <li><span>${escaparHtml(dimensao.nome)}</span><strong>${dimensao.valor}</strong></li>
                `).join("")}
            </ul>
        </section>
        <p class="result-note">Este quiz é recreativo e não constitui avaliação ou diagnóstico psicológico.</p>
        <p class="result-save-note">Resultado salvo. Você também pode consultá-lo no Dashboard.</p>
        <div class="result-actions">
            <button class="restart-button" type="button">Refazer quiz ↻</button>
            <a class="restart-button dashboard-link" href="./dash.html">Ver Dashboard →</a>
        </div>
    `;

    const imagem = quizContent.querySelector(".result-character img");
    if (imagem) {
        imagem.addEventListener("error", () => {
            imagem.remove();
            const fallback = document.createElement("p");
            fallback.className = "result-character-fallback";
            fallback.textContent = personagem.nome;
            quizContent.querySelector("#result-character").appendChild(fallback);
        }, { once: true });
    }

    const canvasRadar = quizContent.querySelector("#profile-radar");
    const descricaoRadar = valoresRadar
        .map((dimensao) => `${dimensao.nome}: ${dimensao.valor}`)
        .join("; ");
    canvasRadar.setAttribute("aria-label", `Gráfico radar do seu perfil. ${descricaoRadar}`);

    if (typeof Chart === "function") {
        try {
            criarGraficoRadar(canvasRadar, valoresRadar);
        } catch (erro) {
            console.error("Não foi possível renderizar o gráfico radar.", erro);
            canvasRadar.insertAdjacentHTML("afterend", '<p class="chart-unavailable">Gráfico indisponível no momento.</p>');
        }
    } else {
        canvasRadar.insertAdjacentHTML("afterend", '<p class="chart-unavailable">Gráfico indisponível no momento.</p>');
    }

    quizContent.querySelector(".restart-button").addEventListener("click", refazerQuiz);
}

function refazerQuiz() {
    sessionStorage.removeItem("dashboardData");
    respostasSelecionadas = {};
    perguntaAtual = 0;
    quizFinalizado = false;
    resultadoFinalizacao = null;
    quizMessage.hidden = true;
    quizContent.classList.remove("result-content");
    renderizarPergunta();
}

// ---------- Teclado ----------
document.addEventListener("keydown", (evento) => {
    // Atalhos do quiz só funcionam durante as perguntas
    if (quizFinalizado || perguntas.length === 0) return;

    // Não atrapalha quem está digitando em campos de texto
    const elemento = evento.target;
    const estaDigitando = elemento.isContentEditable
        || ["INPUT", "TEXTAREA", "SELECT"].includes(elemento.tagName);
    if (estaDigitando) return;

    const pergunta = perguntas[perguntaAtual];
    const jaRespondeu = Boolean(respostasSelecionadas[pergunta.id]);

    if (["1", "2", "3", "4"].includes(evento.key)) {
        selecionarResposta(pergunta.respostas[Number(evento.key) - 1].opcao);
    } else if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        voltarPergunta();
    } else if (evento.key === "ArrowRight" && jaRespondeu) {
        evento.preventDefault();
        avancarPergunta();
    } else if (evento.key === "Enter" && jaRespondeu && elemento.tagName !== "BUTTON") {
        evento.preventDefault();
        avancarPergunta();
    }
});

// ---------- Início ----------
carregarDados().catch((erro) => {
    mostrarErro("Não foi possível carregar as perguntas do quiz.", erro);
});