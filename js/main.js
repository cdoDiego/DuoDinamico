let canal, duo;
let team = [];
let teamDuo = [];
let commands = ['poke1', 'poke2', 'poke3', 'poke4', 'poke5', 'poke6'];
let commandsDuo = ['poke1', 'poke2', 'poke3', 'poke4', 'poke5', 'poke6'];
let deathCommand = 'death';
let death = 0;

function init() {
    const urlParams = new URLSearchParams(window.location.search);
    canal = urlParams.get('canal');
    duo = urlParams.get('duo');
    const comando = urlParams.get('comando');
    const comandoduo = urlParams.get('comandoduo');
    const deathCommandUrl = urlParams.get('deathCommand');

    // Mostrar las variables en consola (puedes hacer algo con ellas)
    console.log('Variable 1:', canal);
    console.log('Variable 2:', duo);

    // Verifica los valores antes de iniciar
    var canales = [canal, duo];

    if (comando) {
        commands = generarComandos(comando, 6);
    }

    if(deathCommandUrl) {
        deathCommand = deathCommandUrl;
    }

    if (comandoduo) {
        commandsDuo = generarComandos(comandoduo, 6);
    }

    team = JSON.parse(localStorage.getItem('team')) || [];
    for(let i = 0; i<6; i++) {
        if(team[i]) {
            var elemento = document.getElementById('pk'+(+i+1));
            elemento.src = team[i].sprite;
            const nickElement = document.getElementById('nick'+(+i+1));
            nickElement.innerHTML = team[i].nick;
            if(team[i].morido) {
                agregarClase('pk'+(+i+1), 'bw');
            }
        }
    }
    teamDuo = JSON.parse(localStorage.getItem('teamDuo')) || [];
    for(let i = 0; i<6; i++) {
        if(teamDuo[i]) {
            var elemento = document.getElementById('pk'+(+i+1)+'duo');
            elemento.src = teamDuo[i].sprite;
            if(teamDuo[i].morido) {
                agregarClase('pk'+(+i+1)+'duo', 'bw');
            }
        }
    }

    death = +localStorage.getItem('deathcount') || 0;
    updateDeathCount();

    // Asegúrate de que los valores sean correctamente pasados
    ComfyJS.Init(canal, null, canales);

}

function generarComandos(prefijo, cantidad) {
    let commands = [];
    for (let i = 1; i <= cantidad; i++) {
        commands.push(`${prefijo}${i}`);
    }
    return commands;
}

async function apiPokemon(poke) {
    var pokemon = await fetch('https://pokeapi.co/api/v2/pokemon/' + poke);
    if (pokemon.status != 404) return pokemon.json();
    else return 'Not Found';
}

function setPokemon(message, pos) {
    message = message.trim();
    let num = message.split(' ')[0];
    let nick = message.split(' ')[1];
    if (num != '' && num != undefined) {
        if (num != 'd'){
            changeTeam(num, nick, pos);
        }
        else {
            agregarClase('pk'+(+pos+1), 'bw');
            teamDuo[pos].morido = true;
            localStorage.setItem('team', JSON.stringify(team));
        }
    }
    else {
        var elemento = document.getElementById('pk'+(+pos+1));
        elemento.src = 'img/MainBlank.png';
        const nickElement = document.getElementById('nick'+(+pos+1));
        nickElement.innerHTML = '';
        team[pos] = null;
        localStorage.setItem('team', JSON.stringify(team));
        quitarClase('pk'+(+pos+1), 'bw');
    }
}

function setPokemonDuo(message, pos) {
    message = message.trim();
    let num = message.split(' ')[0];
    let nick = message.split(' ')[1];
    if (num != '' && num != undefined) {
        if (num != 'd'){
            changeTeamDuo(num, nick, pos);
        }
        else {
            agregarClase('pk'+(+pos+1)+'duo', 'bw');
            teamDuo[pos].morido = true;
            localStorage.setItem('teamDuo', JSON.stringify(teamDuo));
        }
    }
    else {
        var elemento = document.getElementById('pk'+(+pos+1));
        elemento.src = 'img/DuoBlank.png';
        const nickElement = document.getElementById('nick'+(+pos+1));
        nickElement.innerHTML = '';
        teamDuo[pos] = null;
        localStorage.setItem('teamDuo', JSON.stringify(teamDuo));
        quitarClase('pk'+(+pos+1)+'duo', 'bw');
    }
}

async function changeTeam(num, nick, pos) {
    var pokemon = await apiPokemon(num);
    if(pokemon != 'Not Found'){
        let numero = completarConCeros(pokemon.id);
        const specie = pokemon.species.name;
        let urlImage = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${numero}/Normal.png`;
        var elemento = document.getElementById('pk'+(+pos+1));
        quitarClase('pk'+(+pos+1), 'bw');
        if (elemento) {
            elemento.src = urlImage;
        }
        const nickElement = document.getElementById('nick'+(+pos+1));
        nickElement.innerHTML = nick || specie;
        if (!team[pos]) {
            team[pos] = {};
        }
        team[pos] = { poke: num, sprite: urlImage, name: specie, nick: nick || specie, numero: numero };
        localStorage.setItem('team', JSON.stringify(team));
    }
}

async function changeTeamDuo(num, nick, pos) {
    var pokemon = await apiPokemon(num);
    if(pokemon != 'Not Found'){
        let numero = completarConCeros(pokemon.id);
        const specie = pokemon.species.name;
        let urlImage = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${numero}/Normal.png`;
        var elemento = document.getElementById('pk'+(+pos+1)+'duo');
        quitarClase('pk'+(+pos+1)+'duo', 'bw');
        if (elemento) {
            elemento.src = urlImage;
        }
        if (!teamDuo[pos]) {
            teamDuo[pos] = {};
        }
        teamDuo[pos] = { poke: num, sprite: urlImage, name: specie, nick: nick || specie, numero: numero };
        localStorage.setItem('teamDuo', JSON.stringify(teamDuo));
    }
}

function agregarClase(idElemento, nuevaClase) {
    var elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.classList.add(nuevaClase);
    }
}

function quitarClase(idElemento, clase) {
    var elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.classList.remove(clase);
    }
}

function completarConCeros(numero) {
    return numero.toString().padStart(4, '0');
}

function updateDeathCount() {
    var elemento = document.getElementById('death');
    elemento.innerHTML = `X${death}`;
    localStorage.setItem('deathcount', death);
}

ComfyJS.onCommand = (user, command, message, flags, extra) => {
    console.log('command', command);
    console.log('message', message);
    console.log('channel', extra.channel);
    console.log(extra.channel + ' == ' + canal + ' ' + (extra.channel == canal));
    if(!flags.broadcaster && !flags.mod) {
        return;
    }
    if(extra.channel.toLowerCase() == canal.toLowerCase()) {
        let index = commands.indexOf(command);
        if(index != -1) {
            setPokemon(message, index);
        }
        if(command == deathCommand) {
            if(message == '' || message == null || message == undefined) {
                death++;
            } else {
                death = +message.split(' ')[0];
            }
            updateDeathCount();
        }
    }

    if(extra.channel.toLowerCase() == duo.toLowerCase()) {
        let index = commandsDuo.indexOf(command);
        if(index != -1) {
            setPokemonDuo(message, index);
        }
    }
}

init();