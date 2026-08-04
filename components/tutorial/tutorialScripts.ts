export interface TutorialStep {
  id: number;
  targetRef?: string;
  title: string;
  text: string;
  audioFile: string;
}

export interface TutorialScript {
  [screenId: string]: TutorialStep[];
}

export const tutorialScripts: TutorialScript = {
  login: [
    {
      id: 0,
      title: "Bem-vindo ao Vortex Primus!",
      text: "Bem-vindo ao Vortex Primus! Aqui você entra com seu e-mail e senha, igual você já faz em outros aplicativos.",
      audioFile: "login_0.mp3",
    },
    {
      id: 1,
      targetRef: "email",
      title: "Digite seu e-mail",
      text: "Digite aqui o e-mail que você cadastrou. É por ele que o sistema te reconhece.",
      audioFile: "login_1.mp3",
    },
    {
      id: 2,
      targetRef: "senha",
      title: "Digite sua senha",
      text: "Agora sua senha. Se esquecer, é só tocar em 'Esqueceu?' que eu te ajudo a criar uma nova.",
      audioFile: "login_2.mp3",
    },
  ],
  novo_cliente: [
    {
      id: 0,
      title: "Cadastrar novo cliente",
      text: "Aqui você cadastra um cliente novo. Só o nome é obrigatório — os outros dados você pode completar depois, com calma.",
      audioFile: "novo_cliente_0.mp3",
    },
    {
      id: 1,
      targetRef: "nome_completo",
      title: "Nome completo",
      text: "Escreva o nome completo do seu cliente. Esse é o único campo obrigatório.",
      audioFile: "novo_cliente_1.mp3",
    },
    {
      id: 2,
      targetRef: "email_telefone",
      title: "Contato",
      text: "Se tiver, coloque o e-mail e o telefone dele. Ajuda a manter contato e enviar lembretes.",
      audioFile: "novo_cliente_2.mp3",
    },
    {
      id: 3,
      targetRef: "dados_pessoais",
      title: "Dados pessoais",
      text: "Data de nascimento, sexo e altura — esses dados ajudam depois na avaliação física e no plano de dieta.",
      audioFile: "novo_cliente_3.mp3",
    },
    {
      id: 4,
      targetRef: "objetivo_atividade",
      title: "Objetivo e atividade",
      text: "Toque no objetivo do cliente, tipo Emagrecimento ou Hipertrofia, e o nível de atividade física dele.",
      audioFile: "novo_cliente_4.mp3",
    },
    {
      id: 5,
      targetRef: "observacoes",
      title: "Observações e restrições",
      text: "Por fim, anote qualquer observação importante ou restrição alimentar. Depois é só tocar em Salvar.",
      audioFile: "novo_cliente_5.mp3",
    },
  ],
  metas: [
    {
      id: 0,
      title: "Suas metas do mês",
      text: "Aqui você define suas metas do mês. O Vortex calcula sozinho quanto falta por semana e por dia.",
      audioFile: "metas_0.mp3",
    },
    {
      id: 1,
      targetRef: "aba_atendimento",
      title: "Aba Atendimento",
      text: "Nessa aba, defina quantos Agendamentos e Avaliações você quer fazer no mês.",
      audioFile: "metas_1.mp3",
    },
    {
      id: 2,
      targetRef: "aba_comercial",
      title: "Aba Comercial",
      text: "Aqui são suas metas de negócio: Apresentações do Kit, Kits Vendidos, Novos Clientes, Repetidores e Lucro Mensal.",
      audioFile: "metas_2.mp3",
    },
    {
      id: 3,
      targetRef: "botao_editar_meta",
      title: "Editar meta",
      text: "Pra mudar qualquer meta, é só tocar no lapisinho e digitar o novo número.",
      audioFile: "metas_3.mp3",
    },
  ],
  nova_venda: [
    {
      id: 0,
      title: "Registrar venda",
      text: "Fez uma venda? Vamos lançar aqui — leva menos de um minuto.",
      audioFile: "nova_venda_0.mp3",
    },
    {
      id: 1,
      targetRef: "tipo_venda",
      title: "Tipo de venda",
      text: "Primeiro, escolha: é um Acesso, ou seja, um Kit, ou um Produto Fechado avulso?",
      audioFile: "nova_venda_1.mp3",
    },
    {
      id: 2,
      targetRef: "kit_produto_cliente",
      title: "Kit/Produto e Cliente",
      text: "Selecione o kit ou produto, e depois o cliente. Se ele não estiver cadastrado ainda, sem problema — digite o nome na linha de baixo.",
      audioFile: "nova_venda_2.mp3",
    },
    {
      id: 3,
      targetRef: "indicacao",
      title: "Indicação",
      text: "Se esse cliente veio indicado por outro, marque aqui. Isso ajuda a acompanhar quem mais indica pra você.",
      audioFile: "nova_venda_3.mp3",
    },
    {
      id: 4,
      targetRef: "qtd_valor",
      title: "Quantidade e valor",
      text: "Confirme a quantidade e o valor. O Vortex calcula o total e o seu lucro sozinho.",
      audioFile: "nova_venda_4.mp3",
    },
  ],
  avaliacao: [
    {
      id: 0,
      title: "Avaliação física",
      text: "Vamos registrar a avaliação física do seu cliente. Você pode preencher só o essencial, ou completo — do seu jeito.",
      audioFile: "avaliacao_0.mp3",
    },
    {
      id: 1,
      targetRef: "data_peso",
      title: "Data e peso",
      text: "Confirme a data da avaliação e o peso do cliente. Esses dois são os únicos obrigatórios.",
      audioFile: "avaliacao_1.mp3",
    },
    {
      id: 2,
      targetRef: "medidas_tronco",
      title: "Medidas do tronco",
      text: "Agora as medidas do tronco: cintura, quadril, peitoral e abdômen, se você tiver a fita métrica em mãos.",
      audioFile: "avaliacao_2.mp3",
    },
    {
      id: 3,
      targetRef: "medidas_membros",
      title: "Medidas dos membros",
      text: "Aqui os membros: braço, coxa e panturrilha, direito e esquerdo.",
      audioFile: "avaliacao_3.mp3",
    },
    {
      id: 4,
      targetRef: "dados_avancados",
      title: "Dados avançados",
      text: "Esses são os dados mais avançados, tipo de balança de bioimpedância. Se não tiver, sem problema.",
      audioFile: "avaliacao_4.mp3",
    },
    {
      id: 5,
      targetRef: "auto_preencher",
      title: "Auto-Preencher via IA",
      text: "Não tem esses dados avançados? Toca aqui em Auto-Preencher via IA, e o Vortex estima pra você usando peso, altura e cintura.",
      audioFile: "avaliacao_5.mp3",
    },
  ],
};
