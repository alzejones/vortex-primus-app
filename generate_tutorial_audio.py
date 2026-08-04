#!/usr/bin/env python3
"""
Gera áudios do tutorial usando edge-tts
Voz: pt-BR-FranciscaNeural, rate=-5%
"""

import asyncio
import edge_tts
import os

VOICE = "pt-BR-FranciscaNeural"
RATE = "-5%"
OUTPUT_DIR = "assets/tutorial-audio"

SCRIPTS = {
    "login": [
        "Bem-vindo ao Vortex Primus! Aqui você entra com seu e-mail e senha, igual você já faz em outros aplicativos.",
        "Digite aqui o e-mail que você cadastrou. É por ele que o sistema te reconhece.",
        "Agora sua senha. Se esquecer, é só tocar em 'Esqueceu?' que eu te ajudo a criar uma nova.",
    ],
    "novo_cliente": [
        "Aqui você cadastra um cliente novo. Só o nome é obrigatório — os outros dados você pode completar depois, com calma.",
        "Escreva o nome completo do seu cliente. Esse é o único campo obrigatório.",
        "Se tiver, coloque o e-mail e o telefone dele. Ajuda a manter contato e enviar lembretes.",
        "Data de nascimento, sexo e altura — esses dados ajudam depois na avaliação física e no plano de dieta.",
        "Toque no objetivo do cliente, tipo Emagrecimento ou Hipertrofia, e o nível de atividade física dele.",
        "Por fim, anote qualquer observação importante ou restrição alimentar. Depois é só tocar em Salvar.",
    ],
    "metas": [
        "Aqui você define suas metas do mês. O Vortex calcula sozinho quanto falta por semana e por dia.",
        "Nessa aba, defina quantos Agendamentos e Avaliações você quer fazer no mês.",
        "Aqui são suas metas de negócio: Apresentações do Kit, Kits Vendidos, Novos Clientes, Repetidores e Lucro Mensal.",
        "Pra mudar qualquer meta, é só tocar no lapisinho e digitar o novo número.",
    ],
    "nova_venda": [
        "Fez uma venda? Vamos lançar aqui — leva menos de um minuto.",
        "Primeiro, escolha: é um Acesso, ou seja, um Kit, ou um Produto Fechado avulso?",
        "Selecione o kit ou produto, e depois o cliente. Se ele não estiver cadastrado ainda, sem problema — digite o nome na linha de baixo.",
        "Se esse cliente veio indicado por outro, marque aqui. Isso ajuda a acompanhar quem mais indica pra você.",
        "Confirme a quantidade e o valor. O Vortex calcula o total e o seu lucro sozinho.",
    ],
    "avaliacao": [
        "Vamos registrar a avaliação física do seu cliente. Você pode preencher só o essencial, ou completo — do seu jeito.",
        "Confirme a data da avaliação e o peso do cliente. Esses dois são os únicos obrigatórios.",
        "Agora as medidas do tronco: cintura, quadril, peitoral e abdômen, se você tiver a fita métrica em mãos.",
        "Aqui os membros: braço, coxa e panturrilha, direito e esquerdo.",
        "Esses são os dados mais avançados, tipo de balança de bioimpedância. Se não tiver, sem problema.",
        "Não tem esses dados avançados? Toca aqui em Auto-Preencher via IA, e o Vortex estima pra você usando peso, altura e cintura.",
    ],
}


async def generate_audio(text: str, output_file: str):
    """Gera um arquivo de áudio usando edge-tts"""
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(output_file)
    print(f"✓ {output_file}")


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    tasks = []
    for screen_id, texts in SCRIPTS.items():
        for step, text in enumerate(texts):
            output_file = os.path.join(OUTPUT_DIR, f"{screen_id}_{step}.mp3")
            tasks.append(generate_audio(text, output_file))
    
    await asyncio.gather(*tasks)
    print(f"\n✓ {len(tasks)} arquivos de áudio gerados em {OUTPUT_DIR}/")


if __name__ == "__main__":
    asyncio.run(main())
