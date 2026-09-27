let activeSearchedTimeZone = null;
let activeSearchedName = "";

// Banco nativo inteligente para respostas instantâneas das cidades mais buscadas (Garante funcionamento offline)
const fastDatabase = {
    "paris": "Europe/Paris", "franca": "Europe/Paris", "frança": "Europe/Paris",
    "londres": "Europe/London", "london": "Europe/London", "reino unido": "Europe/London",
    "roma": "Europe/Rome", "rome": "Europe/Rome", "italia": "Europe/Rome", "itália": "Europe/Rome",
    "berlim": "Europe/Berlin", "berlin": "Europe/Berlin", "alemanha": "Europe/Berlin",
    "lisboa": "Europe/Lisbon", "portugal": "Europe/Lisbon",
    "madri": "Europe/Madrid", "madrid": "Europe/Madrid", "espanha": "Europe/Madrid",
    "moscou": "Europe/Moscow", "moscow": "Europe/Moscow", "russia": "Europe/Moscow", "rússia": "Europe/Moscow",
    
    "sao paulo": "America/Sao_Paulo", "são paulo": "America/Sao_Paulo", "rio de janeiro": "America/Rio_De_Janeiro", "brasil": "America/Sao_Paulo", "brazil": "America/Sao_Paulo",
    "nova york": "America/New_York", "new york": "America/New_York", "ny": "America/New_York", "estados unidos": "America/New_York",
    "los angeles": "America/Los_Angeles", "miami": "America/Miami",
    "buenos aires": "America/Argentina/Buenos_Aires", "argentina": "America/Argentina/Buenos_Aires",
    "mexico": "America/Mexico_City", "méxico": "America/Mexico_City",
    "toronto": "America/Toronto", "canada": "America/Toronto", "canadá": "America/Toronto",

    "toquio": "Asia/Tokyo", "tóquio": "Asia/Tokyo", "tokyo": "Asia/Tokyo", "japao": "Asia/Tokyo", "japão": "Asia/Tokyo",
    "pequim": "Asia/Shanghai", "beijing": "Asia/Shanghai", "china": "Asia/Shanghai",
    "sidney": "Australia/Sydney", "sydney": "Australia/Sydney", "australia": "Australia/Sydney",
    "cairo": "Africa/Cairo", "egito": "Africa/Cairo"
};

function cleanText(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function updateClocks() {
    const now = new Date();

    // 1. Horário Local
    document.getElementById('local-time').textContent = now.toLocaleTimeString('pt-BR');

    // 2. Horários Fixos Estáveis
    document.getElementById('ny-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'America/New_York' });
    document.getElementById('london-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'Europe/London' });
    document.getElementById('tokyo-time').textContent = now.toLocaleTimeString('pt-BR', { timeZone: 'Asia/Tokyo' });

    // 3. Horário Dinâmico da Cidade Buscada
    if (activeSearchedTimeZone !== null) {
        try {
            // Se for uma string de fuso IANA (ex: Europe/Paris)
            if (typeof activeSearchedTimeZone === 'string') {
                const options = { timeZone: activeSearchedTimeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' };
                document.getElementById('searched-time').textContent = now.toLocaleTimeString('pt-BR', options);
            } else {
                // Se for o cálculo matemático baseado na longitude
                const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
                const calculatedDate = new Date(utcTime + (3600000 * activeSearchedTimeZone));
                document.getElementById('searched-time').textContent = calculatedDate.toLocaleTimeString('pt-BR');
            }
        } catch (e) {
            console.error(e);
        }
    }
}

async function searchCity() {
    const query = document.getElementById('search-input').value.trim();
    const errorEl = document.getElementById('error-message');

    if (!query) return;
    errorEl.textContent = ""; 

    const searchKey = cleanText(query);

    // ETAPA 1: Se for uma cidade comum/famosa cadastrada, responde na hora e ignora bloqueios de rede
    if (fastDatabase[searchKey]) {
        const ianaTimeZone = fastDatabase[searchKey];
        activeSearchedTimeZone = ianaTimeZone;
        activeSearchedName = query.charAt(0).toUpperCase() + query.slice(1);

        document.getElementById('searched-name').textContent = activeSearchedName;
        document.getElementById('searched-timezone').textContent = `Fuso Horário Nível Global: ${ianaTimeZone}`;
        updateClocks();
        return;
    }

    // ETAPA 2: Se for qualquer outra localização do mundo, faz a busca dinâmica contornando as restrições do GitHub
    try {
        // Usamos uma URL alternativa de geocodificação aberta que não bloqueia o domínio do GitHub Pages
        const response = await fetch(`https://maps.co{encodeURIComponent(query)}`);
        
        if (!response.ok) throw new Error("Serviço temporariamente indisponível.");

        const data = await response.json();
        if (!data || data.length === 0) {
            errorEl.textContent = "Localização não encontrada. Tente especificar 'Cidade, País'.";
            return;
        }

        const location = data[0];
        activeSearchedName = location.display_name.split(',').slice(0, 2).join(',');

        // Descobre o fuso horário comercial pela Longitude geográfica da API aberta
        const lon = parseFloat(location.lon);
        activeSearchedTimeZone = Math.round(lon / 15);

        const gmtLabel = activeSearchedTimeZone >= 0 ? `GMT+${activeSearchedTimeZone}` : `GMT${activeSearchedTimeZone}`;
        document.getElementById('searched-name').textContent = activeSearchedName;
        document.getElementById('searched-timezone').textContent = `Fuso Horário Calculado: ${gmtLabel}`;
        
        updateClocks();

    } catch (error) {
        console.error(error);
        errorEl.textContent = "Erro de conexão com os servidores mundiais. Tente uma cidade próxima.";
    }
}

document.getElementById('search-button').addEventListener('click', searchCity);
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchCity();
});

setInterval(updateClocks, 1000);
updateClocks();
