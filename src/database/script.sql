CREATE DATABASE IF NOT EXISTS quizStarWars;
USE quizStarWars;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personagem (
    id_personagem INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(100) UNIQUE NOT NULL,
    imagem_url VARCHAR(255) NOT NULL,

    lado VARCHAR(20) NOT NULL,

    tagline VARCHAR(255) NOT NULL,
    biografia TEXT NOT NULL,
    justificativa TEXT NOT NULL,

    abertura TINYINT NOT NULL,
    conscienciosidade TINYINT NOT NULL,
    extroversao TINYINT NOT NULL,
    amabilidade TINYINT NOT NULL,
    neuroticismo TINYINT NOT NULL,

    CHECK (lado IN ('luz', 'negro', 'neutro')),

    CHECK (abertura IN (-2, 0, 2)),
    CHECK (conscienciosidade IN (-2, 0, 2)),
    CHECK (extroversao IN (-2, 0, 2)),
    CHECK (amabilidade IN (-2, 0, 2)),
    CHECK (neuroticismo IN (-2, 0, 2))
);

CREATE TABLE IF NOT EXISTS resultado (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_personagem INT NOT NULL,
    compatibilidade INT NOT NULL,

    abertura TINYINT NOT NULL,
    conscienciosidade TINYINT NOT NULL,
    extroversao TINYINT NOT NULL,
    amabilidade TINYINT NOT NULL,
    neuroticismo TINYINT NOT NULL,

    data_resultado DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_resultado_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT fk_resultado_personagem
        FOREIGN KEY (id_personagem)
        REFERENCES personagem(id_personagem),

    CHECK (compatibilidade BETWEEN 0 AND 100),
    
    CHECK (abertura IN (-2, 0, 2)),
    CHECK (conscienciosidade IN (-2, 0, 2)),
    CHECK (extroversao IN (-2, 0, 2)),
    CHECK (amabilidade IN (-2, 0, 2)),
    CHECK (neuroticismo IN (-2, 0, 2))
);

INSERT INTO personagem (
    nome, imagem_url, lado, tagline, biografia, justificativa,
    abertura, conscienciosidade, extroversao, amabilidade, neuroticismo
) VALUES
('Luke Skywalker', '/imgPersonagens/01_luke_skywalker.webp', 'luz',
 'O fazendeiro que olhou para as estrelas e salvou uma galáxia.',
 'Criado em Tatooine, Luke troca a rotina da fazenda de umidade pelo caminho dos Jedi. Idealista e determinado, ele acredita na redenção até mesmo de Darth Vader — e essa fé redefine o destino da galáxia.',
 'Abertura e amabilidade altas: curiosidade pela Força e compaixão até por Vader; disciplina, sociabilidade e controle emocional intermediários, ainda em construção.',
 2, 0, 0, 2, 0),

('Leia Organa', '/imgPersonagens/05_leia_organa.webp', 'luz',
 'Princesa, general e a voz que nunca se cala diante do Império.',
 'Líder da Aliança Rebelde desde jovem, Leia combina firmeza política, coragem em campo e lealdade inegociável às pessoas que ama. Quando tudo desaba, é nela que a galáxia se apoia.',
 'Conscienciosidade, extroversão e amabilidade altas, neuroticismo baixo: liderança organizada e dedicada às pessoas, firme diante de perdas; abertura intermediária pelo pragmatismo.',
 0, 2, 2, 2, -2),

('Han Solo', '/imgPersonagens/14_han_solo.webp', 'neutro',
 'Contrabandista cético, piloto lendário, coração improvável.',
 'Han sobrevive de improviso, carisma e da Millennium Falcon. Diz não acreditar na Força nem em causas — mas está sempre lá quando os amigos precisam, mesmo contra todas as probabilidades.',
 'Extroversão alta e conscienciosidade baixa: desenvoltura e instinto acima do plano; abertura, amabilidade e neuroticismo intermediários, entre o interesse próprio e a lealdade.',
 0, -2, 2, 0, 0),

('Anakin Skywalker', '/imgPersonagens/11_anakin_skywalker.webp', 'luz',
 'O Escolhido: talento imenso, emoções maiores ainda.',
 'Prodígio da Força criado como escravo em Tatooine, Anakin ama intensamente e teme perdas ainda mais intensamente. Sua jornada mostra como paixão sem equilíbrio pode abrir caminho para a queda.',
 'Abertura, extroversão e neuroticismo altos: talento inventivo e intensidade nas relações, com medo da perda difícil de regular; conscienciosidade e amabilidade intermediárias.',
 2, 0, 2, 0, 2),

('Darth Vader', '/imgPersonagens/04_darth_vader.webp', 'negro',
 'O lorde sombrio que transformou dor em ordem e medo em poder.',
 'Outrora o herói Anakin Skywalker, Vader governa pela disciplina implacável e pela presença aterradora. Por baixo da armadura, porém, ainda existe um conflito que a galáxia inteira sente.',
 'Conscienciosidade, extroversão e neuroticismo altos, abertura e amabilidade baixas: disciplina e domínio sustentados por rigidez, coerção e sofrimento intenso, considerando sua fase Sith.',
 -2, 2, 2, -2, 2),

('Obi-Wan Kenobi', '/imgPersonagens/10_obi_wan_kenobi.webp', 'luz',
 'O mestre paciente que mantém a chama acesa nos tempos mais escuros.',
 'Disciplina, humor discreto e senso de dever definem Obi-Wan. Mesmo derrotado pelo destino, ele espera, ensina e protege do exílio — porque a esperança também é uma forma de resistência.',
 'Conscienciosidade e amabilidade altas, neuroticismo baixo: senso de dever, dedicação aos aprendizes e serenidade sob pressão; abertura e extroversão intermediárias.',
 0, 2, 0, 2, -2),

('Padmé Amidala', '/imgPersonagens/35_padme_amidala.webp', 'luz',
 'Rainha aos quatorze, senadora da democracia até o último discurso.',
 'Padmé governa Naboo, enfrenta invasões e defende a República com coragem e diplomacia. Sua força está em negociar, proteger e acreditar nas instituições — mesmo quando elas desmoronam.',
 'Abertura, conscienciosidade, extroversão e amabilidade altas: diplomacia, compromisso político e prioridade ao bem coletivo; neuroticismo intermediário, com emoção sem perder a determinação.',
 2, 2, 2, 2, 0),

('Qui-Gon Jinn', '/imgPersonagens/32_qui_gon_jinn.webp', 'luz',
 'O Jedi que ouvia a Força viva, não o Conselho.',
 'Qui-Gon segue intuição e compaixão acima de regras e hierarquia. É ele quem enxerga em Anakin algo extraordinário — e planta a semente de toda a saga.',
 'Abertura e amabilidade altas, neuroticismo baixo: intuição, compaixão e serenidade; conscienciosidade e extroversão intermediárias, por seguir a intuição em vez dos procedimentos e ter estilo introspectivo.',
 2, 0, 0, 2, -2),

('Yoda', '/imgPersonagens/20_yoda.webp', 'luz',
 'Novecentos anos de sabedoria em 66 centímetros.',
 'Grande Mestre Jedi, Yoda ensina que a Força mora na paciência, na humildade e no autoconhecimento. Falhar, para ele, é o maior dos professores.',
 'Conscienciosidade e amabilidade altas, extroversão e neuroticismo baixos: disciplina Jedi, cuidado com os aprendizes e serenidade contemplativa; abertura intermediária, entre tradição e aprendizado.',
 0, 2, -2, 2, -2),

('Palpatine (Darth Sidious)', '/imgPersonagens/21_palpatine.webp', 'negro',
 'O xadrez sombrio por trás da queda da República.',
 'Senador afável em público e Lorde Sith nas sombras, Palpatine planeja por décadas cada movimento. Manipulação, paciência e ambição absoluta o levaram ao trono da galáxia.',
 'Abertura, conscienciosidade e extroversão altas, amabilidade baixa: planejamento prolongado e influência social, com manipulação dos aliados; neuroticismo intermediário, entre controle estratégico e medo de perder poder.',
 2, 2, 2, -2, 0),

('Conde Dookan', '/imgPersonagens/67_dookan.webp', 'negro',
 'O aristocrata que abandonou os Jedi sem nunca abandonar a postura.',
 'Antigo mestre Jedi, Dookan lidera a causa Separatista com eloquência e idealismo corrompido. Acredita em ordem, tradição e no próprio julgamento acima de qualquer instituição.',
 'Conscienciosidade e extroversão altas, amabilidade e neuroticismo baixos: organização, comando e compostura, usando as pessoas de forma instrumental; abertura intermediária, por questionar os Jedi com visão hierárquica rígida.',
 0, 2, 2, -2, -2),

('Rey', '/imgPersonagens/85_rey.webp', 'luz',
 'A sucateira de Jakku que escolheu o próprio nome.',
 'Sozinha entre os destroços da guerra, Rey aprendeu a sobreviver — e a esperar. Quando a Força a chama, ela transforma solidão em propósito e prova que origem não define destino.',
 'Abertura, extroversão e amabilidade altas: curiosidade, iniciativa e proteção aos aliados; conscienciosidade e neuroticismo intermediários, entre perseverança e impulsividade, medo e capacidade de recuperação.',
 2, 0, 2, 2, 0),

('Finn', '/imgPersonagens/84_finn.webp', 'luz',
 'O stormtrooper que escolheu fugir — e depois escolheu lutar.',
 'Criado pela Primeira Ordem como soldado, Finn abandona o batalhão ao ver o que é obrigado a fazer. Começa fugindo, mas encontra na amizade com Rey, Poe e a Resistência um motivo para voltar e enfrentar o que mais o assustava.',
 'Abertura, extroversão, amabilidade e neuroticismo altos: questiona a doutrinação, se arrisca pelos amigos e sente medo e preocupação marcantes, sobretudo no início; conscienciosidade intermediária, em desenvolvimento.',
 2, 0, 2, 2, 2),

('Poe Dameron', '/imgPersonagens/86_poe_dameron.webp', 'luz',
 'O melhor piloto da galáxia — e o primeiro a entrar no combate.',
 'Impulsivo, carismático e leal, Poe lidera esquadrões pelo instinto e pela paixão. Aprende com o tempo que heroísmo também é saber quando recuar para viver outro dia.',
 'Extroversão alta, demais dimensões intermediárias: assertividade como piloto e líder, com competência, lealdade e confiança misturadas a impulsividade e efeitos da pressão.',
 0, 0, 2, 0, 0),

('Kylo Ren', '/imgPersonagens/89_kylo_ren.webp', 'negro',
 'O herdeiro de Vader que tentou matar o próprio passado.',
 'Filho de Leia e Han, Ben Solo renuncia ao próprio nome e se torna Kylo Ren, a serviço da Primeira Ordem. Intenso, impulsivo e em guerra consigo mesmo, tenta destruir tudo o que o prende ao passado.',
 'Extroversão e neuroticismo altos, abertura e amabilidade baixas: postura dominante, instabilidade emocional e fixação na herança de Vader, com intimidação e violência; conscienciosidade intermediária.',
 -2, 0, 2, -2, 2),

('Ben Solo', '/imgPersonagens/90_ben_solo.webp', 'luz',
 'O filho de Leia e Han que reencontrou o próprio nome.',
 'Ben Solo é o nome que Kylo Ren abandonou e retoma no fim da saga. Carregando culpa e conflito, ele deixa a raiva de lado, ajuda Rey em Exegol e se sacrifica para salvá-la.',
 'Amabilidade e neuroticismo altos: sacrifício por Rey, com culpa e conflito emocional; demais dimensões intermediárias pela pouca evidência na fase final (estimativa de baixa confiança).',
 0, 0, 0, 2, 2),

('Chewbacca', '/imgPersonagens/13_chewbacca.webp', 'luz',
 'Dois metros de lealdade wookiee e zero paciência para derrotas.',
 'Copiloto da Falcon e amigo de uma vida, Chewie resolve problemas com as próprias mãos — mecânicas ou imperiais. Sua amizade, quando dada, é vitalícia.',
 'Conscienciosidade e amabilidade altas: confiabilidade nas missões e lealdade aos companheiros; abertura, extroversão e neuroticismo intermediários, por evidência limitada sobre sociabilidade comparável à humana.',
 0, 2, 0, 2, 0),

('C-3PO', '/imgPersonagens/02_c_3po.webp', 'luz',
 'Fluente em seis milhões de formas de comunicação e em pânico.',
 'Droide de protocolo meticuloso, C-3PO sobrevive a batalhas entre reclamações e etiquetas. Por trás da ansiedade crônica, há uma lealdade absoluta aos companheiros.',
 'Conscienciosidade e neuroticismo altos, abertura baixa: apego a protocolos e preocupação recorrente diante do perigo; extroversão e amabilidade intermediárias, pois falar muito não é buscar interação e ele ajuda os companheiros apesar do medo.',
 -2, 2, 0, 0, 2),

('R2-D2', '/imgPersonagens/03_r2_d2.webp', 'luz',
 'O herói mais corajoso da saga cabe num barril azul e branco.',
 'Astromecânico ousado e dono de segredos que mudam guerras, R2 nunca hesita em mergulhar no perigo. Carrega a história da galáxia nos circuitos — e nunca conta tudo de uma vez.',
 'Abertura, conscienciosidade e amabilidade altas, neuroticismo baixo: criatividade técnica, confiabilidade e lealdade, com atuação persistente sob perigo (neuroticismo é difícil de inferir em um droide, estimativa de baixa confiança); extroversão intermediária.',
 2, 2, 0, 2, -2),

('Lando Calrissian', '/imgPersonagens/25_lando_calrissian.webp', 'neutro',
 'Apostador, administrador, general — sempre com capa e estilo.',
 'Lando governa a Cidade das Nuvens entre jogos e negócios, erra feio sob pressão do Império e compensa cada erro com coragem. Charme, para ele, é ferramenta e filosofia.',
 'Abertura e extroversão altas: adaptação a oportunidades e charme; conscienciosidade, amabilidade e neuroticismo intermediários, entre competência e oportunismo, interesse pessoal e causa, com evidência insuficiente sobre as emoções.',
 2, 0, 2, 0, 0);
 
 
