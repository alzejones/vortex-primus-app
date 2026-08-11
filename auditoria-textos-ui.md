# Auditoria de Textos da UI — Vortex Primus

**Gerado em:** 10/08/2026, 22:54:45

---

## 📋 Índice

Esta auditoria lista todas as strings visíveis ao usuário encontradas no código-fonte do Vortex Primus.

**Arquivos analisados:** 53

---

## `app/login.tsx`

- A nova senha deve ter no mínimo 6 caracteres.
- Cadastro realizado! Verifique seu e-mail para confirmar a conta.
- Continuar com o Google
- Crie agora
- Código de Verificação
- Código enviado! Verifique o seu e-mail.
- Código inválido ou expirado.
- E-mail
- E-mail válido e senha com mínimo 6 caracteres são necessários.
- Enviámos um código de 6 dígitos para o seu e-mail.
- Esqueceu?
- Ex: 123456
- Mínimo 6 caracteres
- Nova Senha
- Performance & Gestão
- Por favor, preencha o seu e-mail no campo abaixo primeiro.
- Preencha e-mail e senha.
- Preencha o código e a nova senha.
- Redefinir Senha
- Salvar nova senha
- Senha atualizada com sucesso! Você já pode fazer login.
- V
- seu@email.com
- {message}
- ← Voltar para o Login

## `app/set-password.tsx`

- A senha deve ter no mínimo 6 caracteres.
- As senhas não conferem.
- Bem-vindo!
- Confirmar Senha
- Defina sua senha para acessar o seu plano alimentar.
- E-mail
- Erro ao salvar a senha. Tente novamente.
- Este link de convite é inválido ou expirou.{"\n"}
                  Solicite um novo convite ao seu treinador.
- Ir para o Login
- Link inválido
- Mínimo 6 caracteres
- Nova Senha
- Performance & Gestão
- Repita a senha
- Senha definida com sucesso! Entrando...
- Validando convite...
- {loading ? "Salvando..." : "Definir Senha e Entrar"}
- {message}

## `app/license-blocked.tsx`

- Acesso bloqueado
- Erro ao verificar licença
- Houve um problema ao verificar sua licença.
- Limite de clientes atingido
- Não foi possível verificar sua licença. Verifique sua conexão com a internet e tente novamente.
- Período de teste encerrado
- Seu período de teste de 7 dias acabou. Para continuar usando o Vortex Primus, faça upgrade para um plano pago.
- {content.buttonText}
- {content.message}
- {content.title}

## `app/(protected)/clients.tsx`

- + Novo Cliente
- , data?.error ?? error?.message ??
- Alfabética
- Buscar por nome...
- Cadastro
- Nenhum aluno cadastrado.
- Nenhum aluno encontrado.
- Tente buscar por outro nome.
- Toque em "+ Novo Cliente" para começar.
- {formatPhoneBR(item.phone)}
- {item.name}
- {totalClients}
- ↑ Asc
- ↓ Desc

## `app/(protected)/client-create.tsx`

- (00) 00000-0000
- ({calculatedAge})
- Altura (cm)
- Cliente adicionado com sucesso!
- Condições médicas, objetivos, etc...
- DD/MM/AAAA
- E-mail
- Ex: 175
- Ex: João da Silva
- Ex: M ou F
- Ex: intolerância à lactose, alergia a amendoim...
- Ex: joao@email.com
- Nome Completo *
- Novo Cliente
- Nível de Atividade
- O nome do cliente é obrigatório.
- Observações
- Perfil de treinador não encontrado.
- Restrições Alimentares
- Salvar Cliente
- Sessão expirada. Faça login novamente.
- Você atingiu o limite de alunos do seu plano atual. Faça um upgrade para continuar crescendo!
- {ACTIVITY_LABELS[key]}
- {OBJECTIVE_LABELS[key]}
- {statusMsg.type === "success" ? "✅ " :
               statusMsg.type === "limit" ? "👑 " : "⚠️ "}
              {statusMsg.text}
- ⭐ Conhecer Planos

## `app/(protected)/client-details.tsx`

- (16) 99999-9999
- ,
- Abre o WhatsApp com o link de acesso
- Abrir WhatsApp
- Altura (cm)
- Aluno excluído com sucesso!
- Anotações, histórico de lesões, objetivos...
- Cadastre um e-mail para o aluno antes de enviar o convite.
- Cadastre um telefone para o aluno antes de enviar o convite por WhatsApp.
- Convite enviado por e-mail para
- DD/MM/AAAA
- E-mail
- Enviar Convite
- Ex: 175
- Ex: intolerância à lactose, alergia a amendoim...
- Gênero
- Link de convite não retornado. Tente novamente.
- Nome Completo *
- Nome do aluno
- Não foi possível carregar os dados do aluno.
- Nível de Atividade
- O nome é obrigatório.
- Observações
- Perfil atualizado com sucesso!
- Perfil do Aluno
- Por E-mail
- Por WhatsApp
- Restrições Alimentares
- SALVAR ALTERAÇÕES
- Sessão expirada. Faça login novamente.
- WhatsApp / Telefone
- WhatsApp aberto com o link de convite.
- email@exemplo.com
- {ACTIVITY_LABELS[key]}
- {OBJECTIVE_LABELS[key]}
- {confirmDelete ? "⚠️ TEM CERTEZA? CLIQUE PARA EXCLUIR" : "EXCLUIR ALUNO"}
- {inviteEmailSent
                    ? "Convite enviado — aguarde 60s para reenviar"
                    : "Supabase envia o link automaticamente"}
- {isActive ? "Ativo" : "Inativo"}
- {statusMsg.type === "error" ? "⚠️ " : "✅ "}
              {statusMsg.text}
- ✉️ CONVITE
- ➕ Nova Avaliação
- 📈 HISTÓRICO
- 🥗 DIETA

## `app/(protected)/client-diet.tsx`

- % Gordura
- % Músculo
- + Criar Plano Alimentar
- , msg);
    } finally {
      setGeneratingAI(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size=
- BMR {dietResult.bmr} kcal · TDEE {dietResult.tdee} kcal · Massa magra {dietResult.lean_mass} kg
- Metab. Basal
- Metas Calculadas
- Nenhum plano alimentar cadastrado.
- Para calcular as metas, complete o perfil do aluno (objetivo, nível de atividade) e registre uma avaliação física.
- Plano vs Meta
- Proteína
- {ACTIVITY_LABELS[client.activity_level as ActivityLevel] ?? client.activity_level}
- {OBJECTIVE_LABELS[client.objective as Objective] ?? client.objective}
- {client?.name}
- {item.label}
- {item.unit}
- {item.value}
- {m.label}
- {m.unit}
- {m.value}
- {mealPlan.notes}
- {mealPlan.title}
- Última Avaliação Corporal
- ✏️ Editar
- ✨ Gerar Plano com IA
- 💰 Confirmar Venda Herbalife

## `app/(protected)/client-assessments.tsx`

- ,
- Alt:
- Bioimpedância
- Carregando dados do aluno...
- DD/MM/AAAA HH:mm
- Data / Hora
- Excluir Avaliação?
- Histórico de Avaliações
- Idade:
- Medidas do Tronco
- Medidas dos Membros
- Nome:
- Salvar Foto
- Sim, Excluir
- Tem certeza que deseja apagar esta avaliação permanentemente? Esta ação não pode ser desfeita.
- {editingAssessmentId ? "✏️ Editar Avaliação" : "➕ Nova Avaliação"}
- {label}
- {pendingPhotos.length} foto(s)
- {saving ? "Salvando..." : editingAssessmentId ? "Atualizar Avaliação" : "Salvar Avaliação"}
- 🪄 Calcular Avaliação à Distância (IA)

## `app/(protected)/schedule/index.tsx`

- + Novo
- ,
- Agenda Livre
- Alterar Horário
- Cadastrar novo aluno
- Cancelar Agendamento?
- Minha Agenda
- Nova Data
- Novo Agendamento
- Novo Horário
- Qual aluno será avaliado?
- Tem certeza que deseja apagar este horário da sua agenda?
- Você não possui avaliações agendadas para os próximos dias.
- {appt.clients?.name}
- {appt.whatsapp_sent ? "✓" : "💬"}
- {clientSearchQuery.trim()
                  ? `Nenhum aluno encontrado para "${clientSearchQuery}".`
                  : "Nenhum aluno cadastrado ainda."}
- {date.getDate()}
- {editingAppt?.clients?.name}
- {formatHeaderDate(item.title)}
- {getDayName(date)}
- {isSavingEdit ? "Salvando..." : "CONFIRMAR ALTERAÇÃO"}
- {item.name}
- {t === 'Comp.Corporal' ? '⚖️ Comp. Corporal' : '🏃 Condicionamento'}
- {time}
- ← Voltar
- ⏰ {appt.appointment_time.substring(0, 5)}

## `app/(protected)/schedule/new.tsx`

- Agendar Avaliação
- Aluno: {clientName}
- Comp. Corporal
- E o horário?
- Ex: Trazer roupa de treino, chegar 10 min antes...
- O que será avaliado?
- Observações (Opcional)
- Qual o melhor dia?
- {date.getDate()}
- {getDayName(date)}
- {loading ? "Agendando..." : "CONFIRMAR AGENDAMENTO"}
- {time}
- ← Voltar
- ＋ Cadastrar novo aluno

## `app/(protected)/trainer-profile.tsx`

- (00) 00000-0000
- Aparece na seção "Condições de Pagamento" dos planos alimentares em PDF gerados por IA.
- Aparece no cabeçalho e rodapé dos planos alimentares em PDF gerados por IA.
- Aparece no rodapé dos planos alimentares em PDF gerados por IA.
- CPF/CNPJ, e-mail, celular ou chave aleatória
- Capturar dados para homologação
- Celular do Presidente
- Configurar Nova Balança
- Configurações
- Código Pix
- Dados do perfil não foram carregados. Recarregue a tela.
- E-mail (Login) 🔒
- Endereço do Espaço
- Ex: Jardim Irajá, Ribeirão Preto, SP
- Ex: MyBox Irajá
- Gerenciar base de suplementos
- Gerencie as suas informações pessoais e conta.
- Importar Dados do Fineshape
- Informe o celular completo do Presidente, com DDD e o 9 (11 dígitos).
- Informe o celular completo, com DDD e o 9 (11 dígitos).
- Meu Perfil
- Migrar clientes e avaliações
- Mostra um assistente com dicas em cada tela. Você pode desligar quando quiser.
- Mudar plano →
- Nome Completo
- Nome completo do Presidente
- Nome do Espaço
- Nome do Presidente
- Não foi possível carregar os seus dados.
- O e-mail é a sua chave de acesso e não pode ser alterado por aqui.
- O nome do Presidente não pode estar vazio quando o vínculo Herbalife está ativo.
- O nome não pode estar vazio.
- O percentual de desconto deve ser um número entre 0 e 100.
- Percentual de Desconto (%)
- Perfil atualizado com sucesso!
- Plano Atual
- SALVAR ALTERAÇÕES
- Seu nome
- Sou Consultor Independente Herbalife
- Usado nos preços da página "Programas Nutricionais" dos planos em PDF (padrão: 15%).
- Usado para vincular você como Presidente Herbalife à sua equipe de downlines.
- {currentClients}
- {downlineCount} {downlineCount === 1 ? 'consultor vinculado' : 'consultores vinculados'}
- {maxClients}
- {name ? name.substring(0, 2).toUpperCase() : "TR"}
- {planName}
- {planStatus}
- {signingOut ? "Saindo..." : "Sair da conta"}
- {statusMsg.type === "error" ? "⚠️ " : "✅ "}
              {statusMsg.text}
- ⚠️ Você está próximo do limite do plano
- 👥 Minha Equipe Herbalife
- 🕐 {daysLeft} dia{daysLeft !== 1 ? 's' : ''} de trial restante{daysLeft !== 1 ? 's' : ''}
- 🤖 Assistente de Ajuda

## `app/(protected)/plans.tsx`

- ,
- , error.message);
    }
  }

  if (loadingTrainer || loadingPlans) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size=
- Assinar Plano
- Confirmar Assinatura
- Confirmar e Pagar
- Downgrade indisponível
- Erro ao salvar no banco de dados.
- Limite: {plan.max_clients ? `${plan.max_clients} alunos` : "Ilimitado"}
- Plano Atual
- Plano selecionado: {selectedPlan?.name}
- Planos Disponíveis
- R$ {plan.price_monthly.toFixed(2)} / mês
- {plan.name}

## `app/(protected)/upgrade.tsx`

- ,
- ,
        `Deseja assinar o plano ${plan.name}?`,
        [
          { text:
- /mês
- Alunos Ilimitados
- Escolha o plano ideal para escalar a sua lucratividade. Ferramentas criadas para que os seus alunos vejam o seu valor real e nunca queiram parar de treinar.
- Este plano ainda não está configurado no banco de dados.
- ID do treinador não encontrado. Faça login novamente.
- MAIS ESCOLHIDO
- Plano Ativo
- R$
- SEU PLANO ATUAL
- Sessão inválida. Faça login novamente.
- {plan.max_clients} Alunos
- {plan.name}
- {plan.price_monthly}
- {processing ? "Processando..." : "Assinar Agora"}
- ← Voltar
- 🔥 TELA DE UPGRADE

## `app/(protected)/supplements.tsx`

- ({filteredSupplements.length})
- + Novo
- ,
- ,
      `Deseja excluir
- Buscar por nome, marca ou SKU...
- Carboidratos (g)
- Ex: H024
- Ex: Herbalife
- Fibra (g)
- Gordura (g)
- Nome *
- Nome do suplemento
- Observações
- Observações adicionais...
- Porção (g) *
- Proteína (g)
- {editingId ? 'Editar Suplemento' : 'Novo Suplemento'}
- {item.brand}
- {item.name}
- {item.notes}
- {item.sku}
- {label} {value.toFixed(1)}{unit}
- {loading ? 'Salvando...' : 'Salvar'}

## `app/(protected)/scale-calibration.tsx`

- Configurar Nova Balança
- ← Voltar

## `app/(protected)/diet-plan-form.tsx`

- % Gordura
- % Músculo
- + Adicionar Alimento
- + Adicionar Refeição
- Calorias (kcal)
- Carbs (g)
- Clientes não podem criar novos planos.
- Ex: 100g
- Ex: Arroz integral cozido
- Ex: Café da manhã
- Ex: Plano de Hipertrofia
- Gord. (g)
- Horário
- Informe um título para o plano.
- Metab. Basal
- Metas Calculadas
- Nome do Alimento
- Notas Gerais
- Não foi possível carregar o plano.
- Orientações gerais, horários, hidratação...
- Perfil de treinador não carregado.
- Plano salvo com sucesso!
- Prot. (g)
- Proteína
- Realizado vs Meta
- Refeição {mi + 1}
- SALVAR PLANO
- Título do Plano
- {isEditing ? "Editar Plano" : "Novo Plano"}{clientName ? ` — ${clientName}` : ""}
- {item.label}
- {item.unit}
- {item.value}
- {m.label}
- {m.unit}
- {m.value}
- {statusMsg.type === "error" ? "⚠️ " : "✅ "}{statusMsg.text}
- Última Avaliação Corporal
- ✕ Remover
- 🏃‍♂️ Herbalife
- 🔍 TACO

## `app/(protected)/assessment-create.tsx`

- Nenhum aluno ativo encontrado.
- Nova Avaliação
- Selecione o aluno para iniciar a avaliação
- {item.email || "Sem e-mail"}
- {item.name ? item.name.substring(0, 2).toUpperCase() : "?"}
- {item.name}

## `app/(protected)/anthropometry-form.tsx`

- ,
- , error.message);
      return;
    }

    Alert.alert(
- Auto-Preencher via IA
- Avaliação Corporal
- Bioimpedância / Resultados IA
- Calcula Gordura, Músculo e Metabolismo à distância
- Circunferências Complementares (Tronco)
- Medidas Básicas
- Membros (Direito / Esquerdo)
- Preencha os dados da bioimpedância ou fita métrica.
- {label}
- {loading ? "Salvando..." : "SALVAR AVALIAÇÃO"}

## `app/(protected)/herbalife-kits.tsx`

- + Adicionar Produto
- + Novo Kit
- ,
            `Este kit já foi vendido ${count} vez(es) e não pode ser excluído.\n\nDeseja desativá-lo? Ele deixará de aparecer nas novas vendas.`,
            [
              { text:
- , `Confirma a exclusão de
- Buscar por nome…
- Doses
- Ex: 547,00
- Ex: Kit Desafio T21 - Avançado
- Fechado
- Kit de Resgate (sem cobrança)
- Meus Kits
- Nenhum kit cadastrado. Crie seu primeiro kit abaixo!
- Nenhum produto adicionado ainda.
- Nome do Kit
- Preço Padrão (R$)
- Produtos do Kit
- Selecionar Produto
- Tipo do Kit
- {brl(Number(kit.default_price))}
- {editingKit ? 'Editar Kit' : 'Novo Kit'}
- {item.name}
- {item.supplement_name}
- {kit.active ? '✓ Ativo' : 'Inativo'}
- {kit.name}
- {saving ? 'Salvando…' : 'Salvar Kit'}
- ← Voltar
- 💡 Sugestão: R$ {calculateSuggestedPrice().toFixed(2).replace('.', ',')}
- 📦 Vendas

## `app/(protected)/herbalife-team.tsx`

- ,
- = 0 ? T.green : T.red, fontSize: 12, fontWeight: '800' }}>
                        {deltaTotalGrupo >= 0 ? '▲' : '▼'} {Math.abs(deltaTotalGrupo)} vs mês anterior
- Acessos (média/dia)
- Compartilhar o Vortex Primus
- Destaque do Mês
- Destaques do Mês
- Diário
- EQUIPE HERBALIFE
- Estimado mensal
- Execução do Grupo
- Ganho semanal
- Maior Evolução
- Mês
- Nenhum dado de relatório disponível
- Os consultores precisam ativar "Sou Consultor Independente Herbalife" no perfil e informar o seu celular como Presidente.
- P.V.T.
- Painel da Equipe
- Precisa de Apoio
- Previsto = ritmo esperado até hoje · Tendência = fechamento estimado no ritmo atual
- Ranking da Equipe
- Relatórios
- Sem dados
- Sem dados mensais.
- Sem dados semanais.
- Sem meta definida
- Sua equipe ainda não está conectada
- TENDÊNCIA
- Tendência
- {Number(r.acessos_media).toFixed(1)}
- {Number(r.pvt).toFixed(2)}
- {Number(r.tendencia_pvt).toFixed(2)}
- {Number(row.pv).toFixed(2)}
- {atividadeLabel}
- {brl(r.estimado_mensal)}
- {brl(r.ganho_semanal)}
- {brl(r.ganhos)}
- {brl(r.tendencia_ganhos)}
- {brl(row.ganhos)}
- {capitalizedMonth} · {downlines.length} {downlines.length === 1 ? 'consultor ativo' : 'consultores ativos'}
- {d.name.split(' ')[0]}
- {destaqueMes.name.split(' ')[0]} · {Math.round((destaqueMes.execucao || 0) * 100)}%
- {downline.agendamentosMes}
- {downline.avaliacoesMes}
- {downline.metaAgendamentos}
- {downline.metaAvaliacoes}
- {downline.name}
- {downline.trendAgend ? downline.trendAgend.expected : '—'}
- {downline.trendAgend ? downline.trendAgend.projection : '—'}
- {downline.trendAval ? downline.trendAval.expected : '—'}
- {downline.trendAval ? downline.trendAval.projection : '—'}
- {execucaoGrupo}%
- {fmtDate(row.report_date)}
- {initials}
- {maiorEvolucao.name.split(' ')[0]} · +{maiorEvolucao.deltaMoM}
- {medal}
- {metaTotalAgend}
- {metaTotalAval}
- {precisaApoio.name.split(' ')[0]} · {Math.round((precisaApoio.execucao || 0) * 100)}%
- {r.month_start.slice(5, 7)}/{r.month_start.slice(2, 4)}
- {r.trainer_name}
- {row.acessos}
- {row.convites}
- {row.entraram}
- {row.indicacoes}
- {row.novos}
- {statusChip.label}
- {totalAgendGrupo}
- {totalAvalGrupo}
- {trendGrupoAgend ? trendGrupoAgend.expected : '—'}
- {trendGrupoAgend ? trendGrupoAgend.projection : '—'}
- {trendGrupoAval ? trendGrupoAval.expected : '—'}
- {trendGrupoAval ? trendGrupoAval.projection : '—'}
- · {r.trainer_name}
- últimos 6 meses
- — Tendências —
- ✅ AVALIAÇÕES
- ✅ Avaliações
- 👏 Reconhecer
- 👥 {downline.totalAlunos} alunos
- 📅 AGENDAMENTOS
- 📅 Agendamentos

## `app/(protected)/business-goals.tsx`

- NEGÓCIO
- Relatórios
- {t.icon} {t.label}

## `app/(protected)/import-fineshape.tsx`

- 1. Arquivo de Clientes
- 2. Arquivo de Avaliações
- CONFIRMAR IMPORTAÇÃO
- Exportação "avaliacoes.csv" do Fineshape
- Exportação "clientes.csv" do Fineshape
- Importar do Fineshape
- Importação concluída ✅
- {assessmentsFile ? `✅ ${assessmentsFile.fileName} (${assessmentsFile.rows.length} registros)` : "📄 Selecionar arquivo"}
- {clientsFile ? `✅ ${clientsFile.fileName} (${clientsFile.rows.length} registros)` : "📄 Selecionar arquivo"}
- ⚠️ {errorMsg}
- ⚠️ {result.avaliacoes.data_invalida} avaliações com data inválida
- ⚠️ {result.avaliacoes.sem_cliente_correspondente} avaliações sem cliente correspondente pelo nome
- 👥 Clientes: {result.clientes.criados} criados · {result.clientes.ja_existiam} já existiam
            {result.clientes.invalidos > 0 ? ` · ${result.clientes.invalidos} inválidos` : ""}
- 🔁 {result.clientes.duplicados_no_arquivo} linhas duplicadas no arquivo (mesma pessoa repetida) — ignoradas

## `app/(protected)/assessments/conditioning.tsx`

- + Adicionar Mobilidade
- + Adicionar Teste de Cárdio
- + Adicionar Teste de Força
- ,
- Avaliação de Condicionamento
- Carga (kg)
- Cárdio
- DD/MM/AAAA HH:MM
- Data e Hora do Teste:
- Distância (m)
- Erro ao excluir:
- Erro ao salvar:
- Erro: Adicione pelo menos um teste antes de salvar.
- Erro: Referência da avaliação não encontrada.
- Exercício de Força #{index + 1}
- Exercício de Mobilidade #{index + 1}
- Exercício de Resistência #{index + 1}
- Força
- Nome (ex: Toque chão pernas esticadas)
- Nome do Exercício (ex: Back Squat)
- Repetições
- Repetições (se houver)
- Resultado / Nota
- Salvar Avaliação Completa
- Tempo (segundos)
- Tipo (ex: Corrida, Burpee)
- X Remover
- {clientName}
- {message}
- ← Voltar
- ✅ Avaliação excluída com sucesso!
- ✅ Testes físicos salvos com sucesso!
- 🗑️ Excluir Avaliação

## `app/(protected)/assessments/conditioning-evolution.tsx`

- ,
- Avaliação Anterior
- Cg | Rp
- Condicionamento Físico
- D/R | Tmp
- Data da Última
- Dist/Reps
- Evolução
- Evolução no Período
- Exercício
- Mais Recente
- Mobilidade e Estabilidade
- Nenhum teste encontrado
- Resistência Cárdio
- Teste de Força
- x Anterior
- x Total
- {currVal1}
- {currVal2}
- {currVal}
- {dateCurr}
- {datePrev}
- {daysInit} Dias
- {daysPrev} Dias
- {diff1Init}
- {diff1Prev}
- {diff2Init}
- {diff2Prev}
- {diffInit}
- {diffLoadInit}
- {diffLoadPrev}
- {diffPrev}
- {diffRepsInit}
- {diffRepsPrev}
- {formatDate(assessment.date)}
- {item.exercise_name}
- {item.load_kg || '-'}
- {item.repetitions || '-'}
- {item.test_name}
- {item.test_type}
- {prevItem?.load_kg || '-'}
- {prevItem?.repetitions || '-'}
- {prevVal1}
- {prevVal2}
- {prevVal}
- {selectedIndex === index ? "Em Exibição" : "Ver Detalhes"}
- ← Voltar para {clientName}
- ✏️ Editar
- 📅 Histórico de Avaliações
- 📲 COMPARTILHAR

## `app/(client)/diet.tsx`

- % Gordura
- % Músculo
- + Criar Plano Alimentar
- A IA está criando seu plano personalizado...
- Atualize seu objetivo e estilo de vida para recalcular suas metas.
- BMR {Number(dietResult.bmr).toFixed(1)} kcal · TDEE {Number(dietResult.tdee).toFixed(1)} kcal · Objetivo: {OBJECTIVE_LABELS[objective as Objective] ?? "—"}
- Configure seu objetivo e nível de atividade abaixo para ver suas metas calóricas.
- Entre em contato com seu treinador para fazer sua avaliação de Composição Corporal.
- Ex: intolerância à lactose, alergia a amendoim...
- Isso pode levar alguns segundos
- Metab. Basal
- Minhas Preferências
- Nenhum plano disponível ainda.
- Não foi possível carregar seus dados.
- Nível de Atividade
- Olá,
- Plano vs Meta
- Preferências salvas com sucesso!
- Proteína
- Restrições Alimentares
- Resumo por dia
- SALVAR PREFERÊNCIAS
- Suas Metas Diárias
- {ACTIVITY_LABELS[key]}
- {Number(log.total_calories ?? 0).toFixed(0)} kcal · P {Number(log.total_protein ?? 0).toFixed(1)}g · C {Number(log.total_carbs ?? 0).toFixed(1)}g · G {Number(log.total_fat ?? 0).toFixed(1)}g
- {Number(m.value).toFixed(1)}
- {OBJECTIVE_LABELS[key]}
- {aiResult.plan.observations}
- {clientName || "Aluno"}
- {dateStr} {timeStr}
- {day.label}
- {day.total_calories} kcal
- {item.label}
- {item.unit}
- {item.value}
- {log.meal_type}
- {log.notes}
- {m.label}
- {m.unit}
- {mealPlan.notes}
- {mealPlan.title}
- {statusMsg.type === "error" ? "⚠️ " : "✅ "}{statusMsg.text}
- Última Avaliação Corporal
- Últimas 10 refeições analisadas por foto.
- ⚠️ {aiError}
- ✏️ Editar Plano Alimentar
- ✨ Gerar Plano com IA
- ✨ Seu Plano Gerado pela IA
- 📖 Diário Alimentar

## `app/(client)/diet-plan-form.tsx`

- % Gordura
- % Músculo
- + Adicionar Alimento
- + Adicionar Refeição
- Calorias (kcal)
- Carbs (g)
- Dados do perfil não carregados. Tente novamente.
- Ex: 100g
- Ex: Arroz integral cozido
- Ex: Café da manhã
- Ex: Plano de Hipertrofia
- Gord. (g)
- Horário
- Informe um título para o plano.
- Metab. Basal
- Metas Calculadas
- Nome do Alimento
- Notas Gerais
- Não foi possível carregar o plano.
- Orientações gerais, horários, hidratação...
- Plano salvo com sucesso!
- Prot. (g)
- Proteína
- Realizado vs Meta
- Refeição {mi + 1}
- SALVAR PLANO
- Título do Plano
- Você não está vinculado a nenhum treinador.{"\n"}
          Entre em contato com um treinador para criar seu plano alimentar.
- {isEditing ? "Editar Plano" : "Meu Plano Alimentar"}
- {item.label}
- {item.unit}
- {item.value}
- {m.label}
- {m.unit}
- {m.value}
- {statusMsg.type === "error" ? "⚠️ " : "✅ "}{statusMsg.text}
- Última Avaliação Corporal
- ← Voltar
- ✕ Remover
- 🏃‍♂️ Herbalife
- 🔍 TACO

## `app/(client)/meal-capture.tsx`

- + Adicionar alimento manualmente
- ,
- , data.error);
        setStep(
- , err.message ??
- , err?.message ??
- , msg);
        setStep(
- Adicionar em qual refeição?
- Alimentos identificados
- Analisando sua refeição...
- Analisar Refeição
- ESTA REFEIÇÃO
- Escolher da Galeria
- Isso pode levar alguns segundos
- Proteína
- Quantidade:
- Tipo de refeição (opcional)
- Tirar Foto
- Tire uma foto ou escolha da galeria para analisar os macros com IA.
- {Number(m.value).toFixed(1)}
- {food.name}
- {food.quantity_grams}g
- {item.name}
- {m.label}
- {m.unit}
- {mt}
- ✕ Cancelar
- ➕ Adicionar ao plano
- 💡 {analysisResult.notes}
- 📅 Registrar hoje

## `app/evolution/[id].tsx`

- % Gordura
- % Gordura Corporal
- % Massa Muscular
- % Músculo
- ({gorduraKg} kg)
- ({musculoKg} kg)
- ATENÇÃO
- Abdômen
- Acesso indisponível.
- As classificações padrão do Cross utilizam as diretrizes da Omron Healthcare e estudos de Gallagher et al. (American Journal of Clinical Nutrition). Avaliações à distância utilizam o protocolo RFM e Mifflin-St Jeor.
- Braço
- CRÍTICO
- Composição Corporal
- FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥
- Gerado por Vortex Primus App
- Gordura Visceral
- Idade Metabólica
- M. ALTO
- Metabolismo Basal
- Nenhuma avaliação encontrada.
- Pantur.
- Peso Corporal
- Referências Científicas 📚
- Relatório Oficial de Evolução
- VORTEX PRIMUS
- {anthro?.basal_metabolic_rate ?? "-"} kcal
- {anthro?.body_fat_index ?? "-"}
- {anthro?.metabolic_age ?? "-"} anos
- {anthro?.weight ?? "-"} kg
- {client?.name}
- {errorMsg || "Avaliação indisponível"}
- {formatValue(anthro?.abdomen)} cm
- {formatValue(anthro?.arm_left)}/{formatValue(anthro?.arm_right)}
- {formatValue(anthro?.calf_left)}/{formatValue(anthro?.calf_right)}
- {formatValue(anthro?.chest)} cm
- {formatValue(anthro?.hip)} cm
- {formatValue(anthro?.thigh_left)}/{formatValue(anthro?.thigh_right)}
- {formatValue(anthro?.waist)} cm
- {getMetabolicStatus(anthro?.metabolic_age, age)?.label}
- {status.label}
- {status?.limits[0]}
- {status?.limits[1]}
- {status?.limits[2]}
- {val} %
- Última Avaliação: {formatDateBR(currentAssessment.date)}
- ℹ️ Referência Científica
- 📋 Diagnóstico Desta Avaliação
- 📏 TRONCO
- 🦵 MEMBROS (E/D)

## `app/assessments/conditioning-public/[id].tsx`

- Acesso indisponível.
- Condicionamento Físico
- FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥
- Gerado por Vortex Primus App
- Histórico de Condicionamento Físico
- VORTEX PRIMUS
- {clientName}
- {errorMsg || "Avaliação indisponível"}

## `components/business/VendasContent.tsx`

- (00) 00000-0000
- + Apresentação
- + Nova Venda
- ,
- Acessos hoje
- Apresentações Kit Acesso de hoje
- Apresentações Kit Acesso hoje
- Buscar por nome…
- Celular (opcional)
- Ganhos hoje
- Nenhuma apresentação lançada hoje.
- Nenhuma venda lançada hoje.
- Nome do prospecto
- Nome e celular serão copiados do cadastro
- Nova Apresentação — Kit Acesso
- Segure numa venda para editar ou excluir.
- Toque para vender · segure para excluir.
- Vendas de hoje
- lucro {brl(Number(v.total_profit))}
- {acessosHoje}
- {apresentacoesHoje}
- {brl(Number(v.total_charged))}
- {brl(ganhosHoje)}
- {item.name}
- {line}
- {m === 'existing' ? 'Cliente Existente' : 'Avulso'}
- {maskPhone(p.prospect_phone)}
- {p.prospect_name}
- {presSaving ? 'Salvando…' : 'Salvar Apresentação'}
- {presSelectedClient ? presSelectedClient.name : 'Selecionar cliente…'}
- {v.clients?.name || v.client_name_manual || 'Cliente'}
                {v.client_status ? `  ·  ${v.client_status[0].toUpperCase()}` : ''}
- {v.sale_type === 'acesso' ? 'Acesso' : 'Produto fechado'} · PV {Number(v.total_pv).toFixed(2)}
- 📊 Relatórios
- 🧰 Kits

## `components/business/RelatoriosContent.tsx`

- ,
- Acessos (média/dia)
- Apresentações Kit Acesso — {fmtDateFull(selectedDate)}
- Estimado mensal
- Ganho semanal
- Ir para hoje
- Mês
- Nenhuma apresentação nesse dia.
- Nenhuma venda nesse dia.
- P.V.T.
- Segure numa venda para editar ou excluir.
- Sem dados mensais.
- Sem dados nos últimos 31 dias.
- Sem dados semanais.
- Toque para vender · segure para excluir.
- lucro {brl(Number(v.total_profit))}
- {Number(r.acessos_media).toFixed(1)}
- {Number(r.pvt).toFixed(2)}
- {Number(r.tendencia_pvt).toFixed(2)}
- {brl(Number(v.total_charged))}
- {brl(daySales.reduce((sum, v) => sum + Number(v.total_charged), 0))}
- {brl(daySales.reduce((sum, v) => sum + Number(v.total_profit), 0))}
- {brl(r.estimado_mensal)}
- {brl(r.ganho_semanal)}
- {brl(r.ganhos)}
- {brl(r.tendencia_ganhos)}
- {daySales.length}
- {fmtDate(r.report_date)}
- {fmtDate(r.week_start)} a {fmtDate(r.week_end)}
- {fmtDateFull(selectedDate)}
- {line}
- {maskPhone(p.prospect_phone)}
- {p.prospect_name}
- {r.acessos}
- {r.apresentacoes}
- {r.convites}
- {r.indicacoes}
- {r.month_start.slice(5, 7)}/{r.month_start.slice(2, 4)}
- {r.novos}
- {t === 'diario' ? 'Diário' : t === 'semanal' ? 'Semanal' : t === 'mensal' ? 'Mensal' : 'Por Dia'}
- {v.clients?.name || v.client_name_manual || 'Cliente'}
                        {v.client_status ? `  ·  ${v.client_status[0].toUpperCase()}` : ''}
- {v.sale_type === 'acesso' ? 'Acesso' : 'Produto fechado'} · PV {Number(v.total_pv).toFixed(2)}
- — Tendências —

## `components/business/MetasContent.tsx`

- Apresentações Kit Acesso
- As metas semanal e diária serão recalculadas automaticamente.
- Avaliações Realizadas
- Clientes Repetidores
- Kit Acesso Vendidos
- Lucro Mensal
- Novos Clientes
- Resumo {periodLabels[period]}
- Taxa Execução
- Tendência fim do mês
- de {formatValue(goal, isCurrency)}
- {GOAL_CONFIG.find((g) => g.type === editingField)?.icon} Meta Mensal — {GOAL_CONFIG.find((g) => g.type === editingField)?.label}
- {Math.round(actuals.agendamentos)}
- {Math.round(actuals.avaliacoes)}
- {Math.round(pct)}%
- {actuals.agendamentos > 0
                  ? Math.round((actuals.avaliacoes / actuals.agendamentos) * 100)
                  : 0}%
- {c.label}
- {formatValue(trend.projection, isCurrency)}
- {icon}
- {label}
- {periodLabels[p]}
- {trend.label}
- ✏️ Meta
- 🏋️ Atendimento
- 💼 Comercial
- 📊 Metas {periodLabels[period].toLowerCase()}s calculadas automaticamente redistribuindo o déficit nos dias úteis restantes do mês.

## `components/business/SaleFormModal.tsx`

- Buscar por nome…
- Celular do cliente avulso (opcional)
- Ou nome do cliente avulso
- Total: {brl((parseFloat((price || '0').replace(',', '.')) || 0) * (parseInt(qty) || 1))}
- Valor unitário (editável)
- Veio por indicação
- Vendendo para:
- {editingSale ? 'Editar Venda' : 'Nova Venda'}
- {manualName}{manualPhone ? ` — ${manualPhone}` : ''}
- {pickerOpen === 'kit'
                ? 'Kits'
                : pickerOpen === 'produto'
                ? 'Produtos'
                : pickerOpen === 'apresentacao'
                ? 'Apresentações de hoje'
                : 'Clientes'}
- {saving ? 'Salvando…' : editingSale ? 'Salvar Alterações' : 'Confirmar Venda'}
- {selClient ? selClient.name : 'Cliente cadastrado (opcional)…'}
- {selKit ? selKit.name : 'Selecionar kit…'}
- {selProduct ? selProduct.name : 'Selecionar produto…'}
- {t === 'acesso' ? 'Acesso (Kit)' : 'Produto Fechado'}
- 🎤 Selecionar de "Apresentações Kit Acesso de hoje"…

## `components/business/SaleActionsModal.tsx`

- Ações da venda
- {sale?.clients?.name || sale?.client_name_manual || 'Cliente'}
- ✏️ Alterar
- 🗑️ Excluir

## `components/TabBar.tsx`

- Negócio
- {tab.icon}
- {tab.label}

## `components/dashboard/DashboardLayoutMobile.tsx`

- + Adicionar Novo Aluno
- +{birthdayClients.length - 3} mais — ver todos
- +{overdueClients.length - 3} mais — ver todos
- ,
- ,
        `${client.name} não tem celular cadastrado. Deseja marcar como parabenizado mesmo assim?`,
        [
          { text:
- Adicionar Novo Aluno
- Adicione seu primeiro aluno para começar
- Agendar Sessão
- Alfabética
- Alunos ativos{licenseStatus.status === 'trial' ? ` · ${getDaysRemaining()} dia${getDaysRemaining() !== 1 ? 's' : ''} de trial` : ''}
- Buscar aluno...
- Cadastro
- Condic.
- Marcar mesmo assim
- Meu Dashboard
- Meus Alunos ({filteredClients.length})
- Nenhum aluno encontrado
- Reavaliações Pendentes
- Sem avaliação há 30+ dias
- Tente outro nome
- Toque para agendar avaliações →
- Ver detalhes →
- Ver todas →
- Visão Geral
- {(apt.clients as any)?.name || 'Aluno'}
- {String(day).padStart(2, '0')}
- {apt.appointment_time?.substring(0, 5)}
- {client.name}
- {currentClients}/{maxClients}
- {filteredClients.length} aluno{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
- {formatApptTypes(apt.types)}
- {formatDateBR(apt.appointment_date)}
- {getInitials(client.name)}
- {getInitials(item.name)}
- {goalsWidget.completedActual}/{goalsWidget.completedGoal} · {pct}%
- {goalsWidget.scheduledActual}/{goalsWidget.scheduledGoal} · {pct}%
- {item.lastAssessmentDate
                        ? `Última: ${Math.floor((new Date().getTime() - new Date(item.lastAssessmentDate).getTime()) / (1000 * 60 * 60 * 24))} dias atrás`
                        : 'Nunca avaliado'}
- {item.name}
- {item.totalViews ?? 0}
- {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
- {overdueClients.length}
- ↑ Asc
- ↓ Desc
- ✅ Avaliações Feitas
- 🎂 Aniversariantes
- 🎂 Aniversariantes ({birthdayClients.length})
- 🎉 Hoje!
- 🎯 Metas do Mês
- 📅 Agendamentos
- 📲 {item.phone ? formatPhoneBR(item.phone) : 'Sem WhatsApp'}
- 🔴 Reavaliações Pendentes ({overdueClients.length})

## `components/dashboard/DashboardLayout.web.tsx`

- ({filteredClients.length})
- + Adicionar Novo Aluno
- +{overdueClients.length - 3} mais — ver todos ↓
- Adicione seu primeiro aluno para começar
- Agendar Avaliação
- Agendar Sessão
- Alfab.
- Alunos Ativos
- AÇÕES RÁPIDAS
- Buscar Aluno...
- Buscar aluno...
- Cadastrar Avaliação da Composição Corporal
- Cadastrar Teste da Avaliação Física
- Cadastro
- Condic.
- Configurações
- Consultar Avaliação da Composição Corporal
- Consultar Avaliações de Condicionamento Físico
- Detalhes do Perfil do Aluno
- Fazer upgrade →
- Meu Dashboard
- Nenhum agendamento.\nToque para agendar avaliações →
- Nenhum aluno encontrado
- Próximas Sessões
- Reavaliações Pendentes
- Recolher ↑
- Sem avaliação há 30+ dias
- Total de Alunos
- Ver detalhes →
- Ver todas →
- Visão Geral
- {(apt.clients as any)?.name || 'Aluno'}
- {Math.round(usagePercentage)}%
- {String(day).padStart(2, '0')}
- {apt.appointment_time?.substring(0, 5)}
- {apt.types}
- {client.lastAssessmentDate
                    ? `Última: ${Math.floor((new Date().getTime() - new Date(client.lastAssessmentDate).getTime()) / (1000 * 60 * 60 * 24))} dias atrás`
                    : 'Nunca avaliado'}
- {client.name}
- {formatDateBR(apt.appointment_date)}
- {getInitials(client.name)}
- {getInitials(item.name)}
- {goalsWidget.completedActual}/{goalsWidget.completedGoal} · {pct}%
- {goalsWidget.scheduledActual}/{goalsWidget.scheduledGoal} · {pct}%
- {item.icon}
- {item.label}
- {item.name}
- {label}
- {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
- {overdueClients.length}
- {planName}
- {sub}
- {value}
- ↑ Asc
- ↓ Desc
- ⚠️ Próximo do limite · Upgrade
- ✅ Avaliações Feitas
- 🎂 Aniversariantes
- 🎉 Hoje!
- 🎯 Metas do Mês
- 📅 Agendamentos
- 📲 {item.phone ? formatPhoneBR(item.phone) : 'Sem WhatsApp'}
- 🔍  Buscar aluno...

## `components/tutorial/TutorialOverlay.tsx`

- Ant.
- {isLastStep ? 'OK' : 'Próx.'}
- {step.text}
- {step.title}

## `components/tutorial/TutorialHelpButton.tsx`

- help-circle

## `components/tutorial/tutorialScripts.ts`

- Aba Atendimento
- Aba Comercial
- Agora as medidas do tronco: cintura, quadril, peitoral e abdômen, se você tiver a fita métrica em mãos.
- Agora sua senha. Se esquecer, é só tocar em
- Aqui os membros: braço, coxa e panturrilha, direito e esquerdo.
- Aqui são suas metas de negócio: Apresentações do Kit, Kits Vendidos, Novos Clientes, Repetidores e Lucro Mensal.
- Aqui você cadastra um cliente novo. Só o nome é obrigatório — os outros dados você pode completar depois, com calma.
- Aqui você define suas metas do mês. O Vortex calcula sozinho quanto falta por semana e por dia.
- Auto-Preencher via IA
- Avaliação física
- Bem-vindo ao Vortex Primus!
- Bem-vindo ao Vortex Primus! Aqui você entra com seu e-mail e senha, igual você já faz em outros aplicativos.
- Cadastrar novo cliente
- Confirme a data da avaliação e o peso do cliente. Esses dois são os únicos obrigatórios.
- Confirme a quantidade e o valor. O Vortex calcula o total e o seu lucro sozinho.
- Dados avançados
- Dados pessoais
- Data de nascimento, sexo e altura — esses dados ajudam depois na avaliação física e no plano de dieta.
- Data e peso
- Digite aqui o e-mail que você cadastrou. É por ele que o sistema te reconhece.
- Digite seu e-mail
- Digite sua senha
- Editar meta
- Escreva o nome completo do seu cliente. Esse é o único campo obrigatório.
- Esses são os dados mais avançados, tipo de balança de bioimpedância. Se não tiver, sem problema.
- Fez uma venda? Vamos lançar aqui — leva menos de um minuto.
- Indicação
- Kit/Produto e Cliente
- Medidas do tronco
- Medidas dos membros
- Nessa aba, defina quantos Agendamentos e Avaliações você quer fazer no mês.
- Nome completo
- Não tem esses dados avançados? Toca aqui em Auto-Preencher via IA, e o Vortex estima pra você usando peso, altura e cintura.
- Objetivo e atividade
- Observações e restrições
- Pra mudar qualquer meta, é só tocar no lapisinho e digitar o novo número.
- Primeiro, escolha: é um Acesso, ou seja, um Kit, ou um Produto Fechado avulso?
- Quantidade e valor
- Registrar venda
- Se esse cliente veio indicado por outro, marque aqui. Isso ajuda a acompanhar quem mais indica pra você.
- Se tiver, coloque o e-mail e o telefone dele. Ajuda a manter contato e enviar lembretes.
- Selecione o kit ou produto, e depois o cliente. Se ele não estiver cadastrado ainda, sem problema — digite o nome na linha de baixo.
- Suas metas do mês
- Tipo de venda
- Toque no objetivo do cliente, tipo Emagrecimento ou Hipertrofia, e o nível de atividade física dele.
- Vamos registrar a avaliação física do seu cliente. Você pode preencher só o essencial, ou completo — do seu jeito.

## `components/AssessmentFormModal.tsx`

- ,
- Auto-Preencher via IA
- Calcula composição com Peso, Altura e Cintura
- DD/MM/AAAA
- Data da Avaliação
- Salvar Avaliação
- {editingAssessment ? "Editar Avaliação" : "Nova Avaliação"}
- {label}
- 🪄 Calcular Avaliação à Distância (IA)

## `components/FoodSearchModal.tsx`

- ADICIONAR AO PLANO
- Buscar alimento (ex: arroz, frango...)
- Gord.
- Macros para {g}g
- Nenhum alimento encontrado para "{query}".
- Prot.
- Quantidade (g)
- Valores nutricionais por 100g: {selected.energy_kcal ?? "—"} kcal ·
          P {selected.protein ?? "—"}g · C {selected.carbs ?? "—"}g · G {selected.fat ?? "—"}g
- {item.energy_kcal != null ? `${item.energy_kcal} kcal` : "—"} · 100g
- {item.name}
- {label}
- {selected ? "Quantidade" : "Buscar Alimento (TACO)"}
- {selected.name}
- {value}
- ← Voltar

## `components/SupplementSearchModal.tsx`

- ADICIONAR AO PLANO
- Buscar suplemento (ex: Shake, Whey...)
- Gord.
- Herbalife Brasil
- MACROS POR PORÇÃO ({selected.serving_size_g}G)
- Macros para {g}g
- Nenhum suplemento encontrado para "{query}".
- POR 100G
- Porção padrão: {selected.serving_size_g}g
- Prot.
- Quantidade (g)
- {item.brand}
- {item.calories != null ? `${item.calories} kcal` : "—"} · porção {item.serving_size_g}g
                {item.notes ? `  ·  ${item.notes}` : ""}
- {item.name}
- {label}
- {selected ? "Quantidade" : "Buscar Suplemento"}
- {selected.name}
- {value}
- ← Voltar

## `components/AssessmentDetailsModal.tsx`

- % Gordura
- % Gordura Corporal
- % Gordura Corporal e Massa Muscular
- % Massa Muscular
- % Músculo
- ({gorduraKg} kg)
- ({musculoKg} kg)
- ATENÇÃO
- Abdômen
- American Journal of Clinical Nutrition
- Braço
- CRÍTICO
- Cedars-Sinai Medical Center
- Composição Corporal
- Cálculo clínico comparativo usando a equação preditiva de gasto energético em repouso ajustada pela massa livre de gordura.
- Detalhes da Avaliação
- FECHAR PAINEL
- FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥
- Gallagher et al.
- Gordura Visceral
- Idade Metabólica
- Idade Metabólica & Metabolismo Basal
- MUITO ALTO
- Metabolismo Basal
- Mifflin-St Jeor
- Níveis alinhados com as diretrizes médicas para prevenção de síndromes metabólicas.
- Omron Healthcare
- Pantur.
- Peso Corporal
- RFM (Relative Fat Mass)
- Referências Científicas 📚
- Vortex Primus - Evolução de {client?.name?.split(' ')[0]}
- {bfStatus.label}
- {bfStatus?.limits?.[0] || '10'}
- {bfStatus?.limits?.[1] || '20'}
- {bfStatus?.limits?.[2] || '30'}
- {getMetabolicStatus(selectedAssessment?.anthropometry?.[0]?.metabolic_age, calculateAge(client?.birth_date))?.label}
- {mmStatus.label}
- {mmStatus?.limits?.[0] || '33'}
- {mmStatus?.limits?.[1] || '39'}
- {mmStatus?.limits?.[2] || '44'}
- {selectedAssessment?.anthropometry?.[0]?.abdomen ?? "-"} cm
- {selectedAssessment?.anthropometry?.[0]?.arm_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.arm_right ?? "-"}
- {selectedAssessment?.anthropometry?.[0]?.basal_metabolic_rate ?? "-"} kcal
- {selectedAssessment?.anthropometry?.[0]?.calf_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.calf_right ?? "-"}
- {selectedAssessment?.anthropometry?.[0]?.chest ?? "-"} cm
- {selectedAssessment?.anthropometry?.[0]?.hip ?? "-"} cm
- {selectedAssessment?.anthropometry?.[0]?.metabolic_age ?? "-"} anos
- {selectedAssessment?.anthropometry?.[0]?.thigh_left ?? "-"}/{selectedAssessment?.anthropometry?.[0]?.thigh_right ?? "-"}
- {selectedAssessment?.anthropometry?.[0]?.waist ?? "-"} cm
- {selectedAssessment?.anthropometry?.[0]?.weight ?? "-"} kg
- {val}
- {val} %
- {vsStatus.label}
- ℹ️ Referência Científica
- 📋 Diagnóstico Desta Avaliação
- 📏 TRONCO
- 📸 Compartilhar Evolução
- 🤖 Relatório para IA
- 🦵 MEMBROS (E/D)
- 🪄 Avaliação à Distância (IA Antropométrica)

## `components/BluetoothScaleConnector.tsx`

- ,
- ,
            `Peso: ${scaleData.weight}kg\nIMC: ${scaleData.bmi}\n% Gordura: ${scaleData.body_fat}%`,
            [{ text:
- A balança conectou mas não enviou dados. Certifique-se de subir
            na balança logo após conectar. Tente novamente ou insira manualmente.
- Balança conectada
- Carregando balanças...
- Conectado! Suba na balança agora.
- Conectando...
- Conectar Balança
- Erro de conexão
- Failed to connect to GATT server
- Infelizmente sua balança não é compatível com a conexão automática
            do Vortex. Você pode inserir manualmente os dados fornecidos pelo
            aplicativo de fábrica da sua balança.
- Inserir dados manualmente
- Nenhuma balança cadastrada. Adicione uma em Config → Minhas Balanças.
- Nenhuma balança selecionada
- Não foi possível conectar. Verifique se a balança está ligada
            e próxima, e tente novamente.
- Procurando sua balança...
- Sua balança não apareceu na lista? Ela pode não ser compatível com
            a conexão automática.
- Suba na balança para obter as medidas
- Tentar novamente
- {'1. Ligue sua balança\n' +
            '2. Clique em "Conectar Balança"\n' +
            '3. Selecione sua balança na lista\n' +
            '4. Suba na balança para medir\n' +
            '5. Os dados preencherão automaticamente'}
- {howToUseExpanded ? '▲' : '▼'}
- {scale.nickname || scale.supported_scale?.model}
- {scale.supported_scale?.brand}
- {scale.supported_scale?.protocol || "Protocolo"}
- {selectedScale?.supported_scale?.model || "Nenhuma balança selecionada"}
- ℹ️ Como usar
- ⚖️ Balança Bluetooth
- ⚠️ Balança não compatível
- ⚠️ Sem resposta da balança

## `components/TrainerScalesManager.tsx`

- + ADICIONAR BALANÇA
- ,
      `Tem certeza que deseja remover
- Adicionar Balança
- Adicione uma balança para começar a registrar medidas corporais.
- Apelido (ex: "Balança Sala 1")
- Balança adicionada com sucesso!
- Balança removida com sucesso!
- Carregando balanças...
- Digite um nome para identificar esta balança
- Erro ao carregar dados.
- Erro ao remover balança.
- Gerencie as balanças conectadas ao seu perfil.
- Minhas Balanças
- Modelo da Balança
- Nenhuma balança cadastrada
- Preencha todos os campos.
- {scale.brand} {scale.model}
- {scale.nickname}
- {scale.supported_scales.brand} {scale.supported_scales.model}
- {scale.supported_scales.connection_type === 'ble_web' ? '🔗 Bluetooth' : '📝 Manual'}
- {statusMsg.type === 'error' ? '⚠️ ' : '✅ '}
            {statusMsg.text}

## `components/MealCard.tsx`

- C: {parseFloat(totals.carbs.toFixed(1))}g
- G: {parseFloat(totals.fat.toFixed(1))}g
- Nenhum alimento cadastrado
- P: {parseFloat(totals.protein.toFixed(1))}g
- {food.name}
- {food.quantity}
- {meal.name}
- {meal.time_suggestion}
- {parseFloat(food.calories.toFixed(1))} kcal
- {parseFloat(totals.calories.toFixed(1))} kcal
- {parts.join(' · ')}

## `components/EvolutionPanel.tsx`

- % Gordura
- % Músculo
- Anterior:
- Atual:
- EVOLUÇÃO TOTAL
- G. Visceral
- Id. Metab.
- Início:
- Met. Basal
- {currDate}
- {emoji}
- {firstDate}
- {label}
- {prevDate}
- ÚLTIMA VS ANTERIOR
- ⏱ {calcInterval(currentAssessment?.date, firstAssessment?.date)}
- ⏱ {calcInterval(currentAssessment?.date, prevAssessment?.date)}
- 📈 Evolução da Composição Corporal

## `components/AIReportModal.tsx`

- Carregando plano alimentar...
- Prévia do Relatório
- {buildReport().split('===== INSTRUÇÃO PARA A IA =====')[0].trim()}
- {copied ? '✅ Copiado! Cole em qualquer IA' : '📋 Copiar Relatório Completo'}
- ✏️ Instrução para a IA (editável)
- 🤖 Relatório para IA

---

**Total de strings encontradas:** 1253
