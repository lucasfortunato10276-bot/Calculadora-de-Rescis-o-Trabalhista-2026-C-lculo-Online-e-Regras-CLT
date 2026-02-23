document.querySelector('button').addEventListener('click', function() {
    const resDiv = document.getElementById('resultado');
    
    // 1. Captura de Dados
    const salario = parseFloat(document.getElementById('salarioBruto').value);
    const dataInicio = new Date(document.getElementById('dataInicio').value);
    const dataFim = new Date(document.getElementById('dataFim').value);
    const motivo = document.getElementById('motivo').value;
    const aviso = document.getElementById('avisoPrevio').value;
    const temFeriasVencidas = document.getElementById('feriasVencidas').checked;

    // Validação Básica
    if (isNaN(salario) || isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
        alert("Por favor, preencha o salário e as datas corretamente.");
        return;
    }
    if (dataFim < dataInicio) {
        alert("A data de afastamento não pode ser anterior à data de admissão.");
        return;
    }

    // 2. Cálculo de Tempo (Meses e Dias)
    const diaSaida = dataFim.getUTCDate();
    const mesSaida = dataFim.getUTCMonth(); // 0 a 11
    const anoSaida = dataFim.getUTCFullYear();
    
    // Cálculo do 13º (Meses com mais de 15 dias trabalhados no ano atual)
    let meses13 = (diaSaida >= 15) ? mesSaida + 1 : mesSaida;
    
    // Cálculo de Férias Proporcionais (Baseado em meses trabalhados desde a última data de admissão)
    const totalDiasTrabalhados = Math.floor((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
    const mesesTotais = Math.floor(totalDiasTrabalhados / 30);
    const mesesFeriasProp = mesesTotais % 12;

    // 3. Cálculo das Verbas
    const saldoSalario = (salario / 30) * diaSaida;
    
    let valor13 = (salario / 12) * meses13;
    let valorFeriasProp = (salario / 12) * mesesFeriasProp;
    let valorFeriasVencidas = temFeriasVencidas ? salario : 0;
    let tercoConstitucional = (valorFeriasProp + valorFeriasVencidas) / 3;

    // Ajustes por Motivo de Demissão
    let multaFGTS = 0;
    if (motivo === "justaCausa") {
        valor13 = 0;
        valorFeriasProp = 0;
        tercoConstitucional = (valorFeriasVencidas / 3); // Apenas sobre as vencidas
    } else if (motivo === "semJustaCausa") {
        // Estimativa de Multa FGTS (Média de 8% de depósito mensal)
        const saldoEstimadoFGTS = (salario * 0.08) * mesesTotais;
        multaFGTS = saldoEstimadoFGTS * 0.40;
    } else if (motivo === "acordo") {
        const saldoEstimadoFGTS = (salario * 0.08) * mesesTotais;
        multaFGTS = saldoEstimadoFGTS * 0.20;
        valor13 = valor13 * 1; // 13º é integral no acordo
    }

    // 4. Aviso Prévio Indenizado (Se aplicável)
    let valorAviso = 0;
    if (aviso === "indenizado" && (motivo === "semJustaCausa" || motivo === "acordo")) {
        const anosCompletos = Math.floor(totalDiasTrabalhados / 365);
        const diasAviso = 30 + (anosCompletos * 3);
        valorAviso = (salario / 30) * Math.min(diasAviso, 90);
    }

    // 5. Deduções (INSS Simplificado 2026)
    let descINSS = 0;
    if (saldoSalario <= 1621) descINSS = saldoSalario * 0.075;
    else if (saldoSalario <= 3000) descINSS = saldoSalario * 0.09;
    else descINSS = saldoSalario * 0.12;

    const totalLiquido = (saldoSalario + valor13 + valorFeriasProp + valorFeriasVencidas + tercoConstitucional + valorAviso + multaFGTS) - descINSS;

    // 6. Reset e Gatilho da Animação
    resDiv.classList.remove('resultado-ativo', 'bg-fluxo');
    void resDiv.offsetWidth; 

    // 7. Exibição do Resultado
    resDiv.innerHTML = `
        <h3 style="color: #1e3a8a; border-bottom: 1px solid #ddd; padding-bottom: 10px;">📊 Detalhamento da Rescisão</h3>
        
        <table style="width: 100%; font-size: 0.9rem; margin-top: 10px;">
            <tr><td>Saldo de Salário (${diaSaida} dias):</td> <td align="right">R$ ${saldoSalario.toFixed(2)}</td></tr>
            <tr><td>13º Salário Proporcional (${meses13}/12):</td> <td align="right">R$ ${valor13.toFixed(2)}</td></tr>
            <tr><td>Férias Proporcionais:</td> <td align="right">R$ ${valorFeriasProp.toFixed(2)}</td></tr>
            ${temFeriasVencidas ? `<tr><td>Férias Vencidas:</td> <td align="right">R$ ${valorFeriasVencidas.toFixed(2)}</td></tr>` : ''}
            <tr><td>Terço Constitucional (1/3):</td> <td align="right">R$ ${tercoConstitucional.toFixed(2)}</td></tr>
            ${valorAviso > 0 ? `<tr><td>Aviso Prévio Indenizado:</td> <td align="right">R$ ${valorAviso.toFixed(2)}</td></tr>` : ''}
            ${multaFGTS > 0 ? `<tr style="color: #059669; font-weight: bold;"><td>Multa FGTS Estimada:</td> <td align="right">R$ ${multaFGTS.toFixed(2)}</td></tr>` : ''}
            <tr style="color: #dc2626;"><td>Desconto INSS (Saldo Salário):</td> <td align="right">- R$ ${descINSS.toFixed(2)}</td></tr>
        </table>

        <div style="margin-top: 20px; padding: 15px; background: #1e3a8a; color: white; border-radius: 8px; text-align: center;">
            <span style="display: block; font-size: 0.8rem; text-transform: uppercase;">Total Líquido a Receber</span>
            <strong style="font-size: 1.8rem;">R$ ${totalLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
        </div>
        
        <p style="font-size: 0.75rem; color: #666; margin-top: 15px; line-height: 1.2;">
            *Nota: Este cálculo é uma estimativa baseada nas regras vigentes em 2026. O valor real pode variar conforme convenções coletivas e horas extras.
        </p>
    `;

    resDiv.classList.add('resultado-ativo', 'bg-fluxo');
    resDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
});