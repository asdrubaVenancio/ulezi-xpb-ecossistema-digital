$file = 'c:\projetos\ulezi-xpb-v2\ulezi-xpb - Cópia\frontend\src\pages\aluno\Dashboards.jsx'
$content = Get-Content $file -Raw -Encoding UTF8

# Atualizar label "Disponibilidade semanal" para "Data do atendimento"
$content = $content.Replace('Disponibilidade semanal', 'Data do atendimento')

# Primeira ocorrência - DashboardEmpresa (input de data)
$oldPattern1 = 'onChange={(e) => {
                                      const data = e.target.value;
                                      setFormConsultoria((p) => ({
                                        ...p,
                                        slot_date: data,
                                        hora_inicio: "",
                                      }));
                                      carregarVagasConsultoria(
                                        consultoriaSelecionada.id,
                                        data,
                                      );
                                    }}'

$newPattern1 = 'onChange={(e) => {
                                      const data = e.target.value;
                                      // Validar se o dia da semana está disponível
                                      if (disponibilidadeConsultoria && disponibilidadeConsultoria.length > 0) {
                                        const diaSelecionado = new Date(data).getDay();
                                        const diasDisponiveis = disponibilidadeConsultoria.map(d => d.dia_semana);
                                        if (!diasDisponiveis.includes(diaSelecionado)) {
                                          const nomesDias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
                                          toast.aviso(`Esta consultoria não atende aos ${nomesDias[diaSelecionado]}s. Selecione um dia disponível.`);
                                          return;
                                        }
                                      }
                                      setFormConsultoria((p) => ({
                                        ...p,
                                        slot_date: data,
                                        hora_inicio: "",
                                      }));
                                      carregarVagasConsultoria(
                                        consultoriaSelecionada.id,
                                        data,
                                      );
                                    }}'

$content = $content.Replace($oldPattern1, $newPattern1)

# Salvar arquivo
Set-Content $file $content -Encoding UTF8
Write-Host 'Atualização concluída!'
