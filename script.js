let activeSearchedTimeZone = null;
let activeSearchedName = "";

function updateClocks() {
    const now = new Date();

    // 1. Horário Local
    document.getElementById('local-time').textContent = now.toLocaleTimeString('pt-BR');

    // 2. Horários Fixos Nativo-Seguros
    document.getElementById('ny-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'America/New_York' });
    document.getElementById('london-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'Europe/London' });
    document.getElementById('tokyo-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'Asia/Tokyo' });

    // 3. Horário Pesquisado Dinâmico (Sincronizado via Timezone Oficial)
    if (activeSearchedTimeZone) {
        try {
            const options = { timeZone: activeSearchedTimeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' };
            document.getElementById('searched-time').textContent = now.toLocaleTimeString('pt-BR', options);
        } catch (e) {
            console.error("Erro ao aplicar fuso horário na interface:", e);
        }
    }
}

async function searchCity() {
    const query = document.getElementById('search-input').value.trim();
    const errorEl = document.getElementById('error-message');

    if (!query) return;
    errorEl.textContent = ""; 

    try {
        // Passo 1: Busca a geolocalização do local digitado no OpenStreetMap
        const response = await fetch(`https://openstreetmap.org{encodeURIComponent(query)}&addressdetails=1&limit=1`, {
            headers: { 'User-Agent': 'RelogioMundialGlobalEducacional/1.0' }
        });

        if (!response.ok) throw new Error("Erro na comunicação com o servidor de mapas.");

        const data = await response.json();
        if (!data || data.length === 0) {
            errorEl.textContent = "Local não encontrado. Certifique-se de digitar corretamente.";
            return;
        }

        const location = data[0]; // Pega o primeiro resultado da lista
        const lat = location.lat;
        const lon = location.lon;

        // Passo 2: Usamos a World Time API para descobrir o fuso horário oficial (IANA) com base na latitude e longitude
        const tzResponse = await fetch(`https://timeapi.world{lat}&lon=${lon}`);
        if (!tzResponse.ok) throw new Error("Erro de rede na API de fuso.");

        const tzData = await tzResponse.json();
        
        // Configura as variáveis globais com a resposta oficial (Ex: "Europe/Paris")
        activeSearchedTimeZone = tzData.timezone || tzData.timeZone; 
        
        const address = location.address || {};
        const city = address.city || address.town || address.village || address.state || query;
        const country = address.country || "";
        activeSearchedName = country ? `${city}, ${country}` : city;

        // Renderiza na tela
        document.getElementById('searched-name').textContent = activeSearchedName;
        document.getElementById('searched-timezone').textContent = `Fuso Horário: ${activeSearchedTimeZone}`;
        
        updateClocks();

    } catch (error) {
        console.error("Erro capturado:", error);
        // Mensagem limpa e profissional para qualquer erro real de conexão
        errorEl.textContent = "Não foi possível carregar o horário deste local. Tente novamente em instantes.";
    }
}

document.getElementById('search-button').addEventListener('click', searchCity);
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchCity();
});

setInterval(updateClocks, 1000);
updateClocks();
