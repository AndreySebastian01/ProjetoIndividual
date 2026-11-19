const dimensoesPerfil = [
    { chave: "abertura", codigo: "O", nome: "Abertura à experiência" },
    { chave: "conscienciosidade", codigo: "C", nome: "Conscienciosidade" },
    { chave: "extroversao", codigo: "E", nome: "Extroversão" },
    { chave: "amabilidade", codigo: "A", nome: "Amabilidade" },
    { chave: "neuroticismo", codigo: "N", nome: "Neuroticismo" }
];

const profileState = document.querySelector("#profile-state");
const profileChartContent = document.querySelector("#profile-chart-content");
const profileQuizLink = document.querySelector("#profile-quiz-link");
const profileLegend = document.querySelector("#profile-legend");
const topState = document.querySelector("#top-state");
const topChartContent = document.querySelector("#top-chart-content");
const topRetryButton = document.querySelector("#top-retry");
const menuButton = document.querySelector(".menuHamburguer");
const siteNavigation = document.querySelector(".navHeader");

function definirMenu(aberto) {
    menuButton.classList.toggle("aberto", aberto);
    siteNavigation.classList.toggle("aberto", aberto);
    menuButton.setAttribute("aria-expanded", String(aberto));
    menuButton.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
}

menuButton.addEventListener("click", () => {
    definirMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

siteNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => definirMenu(false));
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) definirMenu(false);
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") definirMenu(false);
});

function mostrarFalha(elemento, mensagem) {
    elemento.textContent = mensagem;
    elemento.setAttribute("role", "alert");
    elemento.hidden = false;
}

function criarGraficoRadar(canvas, valoresRadar) {
    new Chart(canvas, {
        type: "radar",
        data: {
            labels: dimensoesPerfil.map((dimensao) => [dimensao.codigo, dimensao.nome]),
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
                        label: (contexto) => `${dimensoesPerfil[contexto.dataIndex].nome}: ${contexto.raw}`
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

function carregarPerfil() {
    try {
        const dadosSalvos = sessionStorage.getItem("dashboardData");
        if (!dadosSalvos) {
            profileState.textContent = "Seu perfil aparecerá aqui depois que você finalizar o quiz.";
            profileQuizLink.hidden = false;
            return;
        }

        const dados = JSON.parse(dadosSalvos);
        if (!dados.perfil || typeof dados.perfil !== "object") {
            throw new Error("Os dados do perfil não estão disponíveis.");
        }

        const valoresRadar = dimensoesPerfil.map((dimensao) => {
            const pontuacao = dados.perfil[dimensao.chave];
            if (typeof pontuacao !== "number" || ![-2, 0, 2].includes(pontuacao)) {
                throw new Error("As pontuações do perfil estão incompletas ou inválidas.");
            }
            return {
                ...dimensao,
                valor: Math.round(((pontuacao + 2) / 4) * 100)
            };
        });

        if (typeof Chart !== "function") {
            throw new Error("A biblioteca de gráficos não foi carregada.");
        }

        profileLegend.replaceChildren(...valoresRadar.map((dimensao) => {
            const item = document.createElement("li");
            const nome = document.createElement("span");
            const valor = document.createElement("strong");
            nome.textContent = dimensao.nome;
            valor.textContent = String(dimensao.valor);
            item.append(nome, valor);
            return item;
        }));

        const canvasRadar = document.querySelector("#profile-radar");
        const descricaoRadar = valoresRadar
            .map((dimensao) => `${dimensao.nome}: ${dimensao.valor}`)
            .join("; ");
        canvasRadar.setAttribute("aria-label", `Gráfico radar do seu perfil. ${descricaoRadar}`);
        criarGraficoRadar(canvasRadar, valoresRadar);

        profileState.hidden = true;
        profileChartContent.hidden = false;
    } catch (erro) {
        console.error("Não foi possível carregar o perfil do dashboard.", erro);
        mostrarFalha(profileState, `Não foi possível carregar seu perfil. ${erro.message}`);
    }
}

async function lerRespostaApi(resposta) {
    let dados;
    try {
        dados = await resposta.json();
    } catch (erro) {
        throw new Error("A resposta do servidor não pôde ser lida.");
    }
    if (!resposta.ok) {
        throw new Error(dados.erro || "O servidor não conseguiu carregar os resultados.");
    }
    return dados;
}

function validarTopPersonagens(lista) {
    if (!Array.isArray(lista) || lista.length > 5) {
        throw new Error("A API retornou uma classificação inválida.");
    }

    return lista.map((personagem) => {
        const quantidade = Number(personagem.quantidade);
        if (!Number.isInteger(Number(personagem.id_personagem))
            || typeof personagem.nome !== "string"
            || !personagem.nome.trim()
            || !Number.isInteger(quantidade)
            || quantidade < 1) {
            throw new Error("A API retornou dados inválidos para a classificação.");
        }
        return { ...personagem, quantidade };
    });
}

function criarGraficoBarras(canvas, personagens) {
    canvas.setAttribute("aria-label", `Gráfico de barras do Top 5 de personagens. ${
        personagens.map((personagem) => `${personagem.nome}: ${personagem.quantidade}`).join("; ")
    }`);
    new Chart(canvas, {
        type: "bar",
        data: {
            labels: personagens.map((personagem) => personagem.nome),
            datasets: [{
                label: "Resultados",
                data: personagens.map((personagem) => personagem.quantidade),
                backgroundColor: "rgba(244, 217, 0, 0.78)",
                borderColor: "#f4d900",
                borderWidth: 1,
                borderRadius: 3,
                maxBarThickness: 38
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (contexto) => {
                            const quantidade = contexto.raw;
                            return `${quantidade} ${quantidade === 1 ? "resultado" : "resultados"}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: "#a8afbd",
                        stepSize: 1
                    },
                    grid: { color: "#303744" }
                },
                y: {
                    ticks: {
                        color: "#a8afbd",
                        font: { family: '"Poppins", Arial, Helvetica, sans-serif', size: 11 }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

async function carregarTopPersonagens() {
    topRetryButton.hidden = true;
    topChartContent.hidden = true;
    topState.setAttribute("role", "status");
    topState.textContent = "Carregando resultados...";
    topState.hidden = false;

    try {
        const resposta = await fetch("/api/dashboard/top-personagens");
        const personagens = validarTopPersonagens(await lerRespostaApi(resposta));
        if (personagens.length === 0) {
            topState.textContent = "Ainda não há resultados de quizzes suficientes para montar o ranking.";
            return;
        }
        if (typeof Chart !== "function") {
            throw new Error("A biblioteca de gráficos não foi carregada.");
        }

        criarGraficoBarras(document.querySelector("#top-characters-chart"), personagens);
        topState.hidden = true;
        topChartContent.hidden = false;
    } catch (erro) {
        console.error("Não foi possível carregar o Top 5 de personagens.", erro);
        mostrarFalha(topState, `Não foi possível carregar o ranking. ${erro.message}`);
        topRetryButton.hidden = false;
    }
}

topRetryButton.addEventListener("click", carregarTopPersonagens);

carregarPerfil();
carregarTopPersonagens();
