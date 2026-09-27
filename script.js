let activeSearchedTimeZone = null;
let activeSearchedName = "";

function updateClocks() {
    const now = new Date();

    // 1. Horário Local
    document.getElementById('local-time').textContent = now.toLocaleTimeString('pt-BR');

    // 2. Horários Fixos Seguros
    document.getElementById('ny-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'America/New_York' });
    document.getElementById('london-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'Europe/London' });
    document.getElementById('tokyo-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'Asia/Tokyo' });

    // 3. Horário Pesquisado Dinâmico (Usa o cálculo matemático seguro por Longitude)
    if (activeSearchedTimeZone !== null) {
        // Pega o horário UTC universal do computador do usuário
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        // Cria uma nova data somando a diferença de fuso calculada
        const calculatedDate = new Date(utcTime + (3600000 * activeSearchedTimeZone));
        
        document.getElementById('searched-time').textContent = calculatedDate.toLocaleTimeString('pt-BR');
    }
}

async function searchCity() {
    const query = document.getElementById('search-input').value.trim();
    const errorEl = document.getElementById('error-message');

    if (!query) return;
    errorEl.textContent = ""; 

    try {
        // Passo 1: Busca a cidade na API do OpenStreetMap (Permitida no GitHub Pages)
        const response = await fetch(`https://openstreetmap.org{encodeURIComponent(query)}&addressdetails=1&limit=1`, {
            headers: { 'User-Agent': 'RelogioMundialGlobalEducacional/1.0' }
        });

        if (!response.ok) throw new Error("Erro de comunicação com o servidor.");

        const data = await response.json();
        if (!data || data.length === 0) {
            errorEl.textContent = "Local não encontrado. Certifique-se de digitar corretamente.";
            return;
        }

        const location = data[0]; // Pega o primeiro resultado da lista
        const address = location.address || {};
        
        // Organiza o nome da cidade para exibir na tela
        const city = address.city || address.town || address.village || address.state || query;
        const country = address.country || "";
        activeSearchedName = country ? `${city}, ${country}` : city;

        // Passo 2: CÁLCULO MATEMÁTICO DO FUSO HORÁRIO (À prova de falhas)
        // A Terra tem 360° e 24 fusos horários (360 / 24 = 15° para cada fuso de 1 hora).
        // Pegamos a Longitude real do local encontrada no mapa e dividimos por 15.
        const lon = parseFloat(location.lon);
        activeSearchedTimeZone = Math.round(lon / 15);

        // Formata o texto do fuso encontrado (Ex: GMT+1, GMT-3)
        const gmtLabel = activeSearchedTimeZone >= 0 ? `GMT+${activeSearchedTimeZone}` : `GMT${activeSearchedTimeZone}`;

        // Renderiza na tela
        document.getElementById('searched-name').textContent = activeSearchedName;
        document.getElementById('searched-timezone').textContent = `Fuso Horário Estimado: ${gmtLabel}`;
        
        updateClocks();

    } catch (error) {
        console.error("Erro capturado:", error);
        errorEl.textContent = "Erro ao processar a busca. Tente novamente.";
    }
}

document.getElementById('search-button').addEventListener('click', searchCity);
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchCity();
});

setInterval(updateClocks, 1000);
updateClocks();
