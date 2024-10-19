let canal, duo;
let team = [];
let teamDuo = [];
let commands = ['poke1', 'poke2', 'poke3', 'poke4', 'poke5', 'poke6'];
let commandsDuo = ['poke1', 'poke2', 'poke3', 'poke4', 'poke5', 'poke6'];
let deathCommand = 'muertes';
let death = 0;

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyDIG71lWtcbYZeKISRe8WtZKYWzDrTyEYs",
    authDomain: "duolock-14495.firebaseapp.com",
    projectId: "duolock-14495",
    storageBucket: "duolock-14495.appspot.com",
    messagingSenderId: "842287897673",
    appId: "1:842287897673:web:ac6ac48270cca04363b398",
    measurementId: "G-7J9YPPH5EB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

    if (deathCommandUrl) {
        deathCommand = deathCommandUrl;
    }

    if (comandoduo) {
        commandsDuo = generarComandos(comandoduo, 6);
    }

    cargarDatosDesdeFirestore(canal);
    cargarDatosDesdeFirestoreDuo(duo);
    

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
        if (num != 'd') {
            changeTeam(num, nick, pos);
        }
        else {
            agregarClase('pk' + (+pos + 1), 'bw');
            teamDuo[pos].morido = true;
            localStorage.setItem('team', JSON.stringify(team));
            guardarEquipoEnFirestore(canal, team);
        }
    }
    else {
        var elemento = document.getElementById('pk' + (+pos + 1));
        elemento.src = 'img/MainBlank.png';
        const nickElement = document.getElementById('nick' + (+pos + 1));
        nickElement.innerHTML = '';
        team[pos] = null;
        localStorage.setItem('team', JSON.stringify(team));
        guardarEquipoEnFirestore(canal, team);
        quitarClase('pk' + (+pos + 1), 'bw');
    }
}

function setPokemonDuo(message, pos) {
    message = message.trim();
    let num = message.split(' ')[0];
    let nick = message.split(' ')[1];
    if (num != '' && num != undefined) {
        if (num != 'd') {
            changeTeamDuo(num, nick, pos);
        }
        else {
            agregarClase('pk' + (+pos + 1) + 'duo', 'bw');
            teamDuo[pos].morido = true;
            localStorage.setItem('teamDuo', JSON.stringify(teamDuo));
        }
    }
    else {
        var elemento = document.getElementById('pk' + (+pos + 1));
        elemento.src = 'img/DuoBlank.png';
        const nickElement = document.getElementById('nick' + (+pos + 1));
        nickElement.innerHTML = '';
        teamDuo[pos] = null;
        localStorage.setItem('teamDuo', JSON.stringify(teamDuo));
        quitarClase('pk' + (+pos + 1) + 'duo', 'bw');
    }
}

async function changeTeam(num, nick, pos) {
    var pokemon = await apiPokemon(num);
    if (pokemon != 'Not Found') {
        let numero = completarConCeros(pokemon.id);
        const specie = pokemon.species.name;
        let urlImage = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${numero}/Normal.png`;
        var elemento = document.getElementById('pk' + (+pos + 1));
        quitarClase('pk' + (+pos + 1), 'bw');
        if (elemento) {
            elemento.src = urlImage;
        }
        const nickElement = document.getElementById('nick' + (+pos + 1));
        nickElement.innerHTML = nick || specie;
        if (!team[pos]) {
            team[pos] = {};
        }
        team[pos] = { poke: num, sprite: urlImage, name: specie, nick: nick || specie, numero: numero };
        localStorage.setItem('team', JSON.stringify(team));
        guardarEquipoEnFirestore(canal, team);
    }
}

async function changeTeamDuo(num, nick, pos) {
    var pokemon = await apiPokemon(num);
    if (pokemon != 'Not Found') {
        let numero = completarConCeros(pokemon.id);
        const specie = pokemon.species.name;
        let urlImage = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${numero}/Normal.png`;
        var elemento = document.getElementById('pk' + (+pos + 1) + 'duo');
        quitarClase('pk' + (+pos + 1) + 'duo', 'bw');
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
    if (!flags.broadcaster && !flags.mod) {
        return;
    }
    if (extra.channel.toLowerCase() == canal.toLowerCase()) {
        let index = commands.indexOf(command);
        if (index != -1) {
            setPokemon(message, index);
        }
        if (command == deathCommand) {
            if (message == '' || message == null || message == undefined) {
                death++;
            } else {
                death = +message.split(' ')[0];
            }
            updateDeathCount();
        }
    }

    if (extra.channel.toLowerCase() == duo.toLowerCase()) {
        let index = commandsDuo.indexOf(command);
        if (index != -1) {
            setPokemonDuo(message, index);
        }
    }
}

// Función para guardar el equipo en Firestore
function guardarEquipoEnFirestore(usuario, equipo) {
    const userDocRef = doc(db, 'usuarios', usuario.toLowerCase());
    console.log(equipo);
    setDoc(userDocRef, { team: equipo })
        .then(() => {
            console.log("Equipo guardado correctamente en Firestore.");
        })
        .catch((error) => {
            console.error("Error al guardar equipo en Firestore: ", error);
        });
}

// Función para cargar datos desde Firestore
function cargarDatosDesdeFirestore(usuario) {
    usuario = usuario.toLowerCase();
    const userDocRef = doc(db, 'usuarios', usuario);
    getDoc(userDocRef)
        .then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (data.team) {
                    team = data.team;
                    localStorage.setItem('team', JSON.stringify(team));
                    cargarEquipoEnUI(team); // Cargar en la interfaz
                }
            } else {
                team = JSON.parse(localStorage.getItem('team')) || [null,null,null,null,null,null];
                cargarEquipoEnUI(team);
                guardarEquipoEnFirestore(canal, team);
                console.log("No se encontraron datos para este usuario.");
            }
        })
        .catch((error) => {
            team = JSON.parse(localStorage.getItem('team')) || [];
            cargarEquipoEnUI(team);
            console.error("Error al obtener datos de Firestore: ", error);
        });
}

function cargarDatosDesdeFirestoreDuo(usuario) {
    usuario = usuario.toLowerCase();
    const userDocRef = doc(db, 'usuarios', usuario);
    getDoc(userDocRef)
        .then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (data.team) {
                    teamDuo = data.team;
                    localStorage.setItem('teamDuo', JSON.stringify(teamDuo));
                    cargarEquipoDuoEnUI(teamDuo); // Cargar en la interfaz
                }
            } else {
                teamDuo = JSON.parse(localStorage.getItem('teamDuo')) || [null,null,null,null,null,null];
                cargarEquipoDuoEnUI(teamDuo);
                guardarEquipoEnFirestore(duo, teamDuo);
                console.log("No se encontraron datos para este usuario.");
            }
        })
        .catch((error) => {
            teamDuo = JSON.parse(localStorage.getItem('teamDuo')) || [];
            cargarEquipoDuoEnUI(teamDuo);
            console.error("Error al obtener datos de Firestore: ", error);
        });
}

function cargarEquipoEnUI(equipo) {
    for(let i = 0; i < 6; i++) {
        if(equipo[i]) {
            var elemento = document.getElementById('pk'+(+i+1));
            elemento.src = equipo[i].sprite;
            const nickElement = document.getElementById('nick'+(+i+1));
            nickElement.innerHTML = equipo[i].nick;
            if(equipo[i].morido) {
                agregarClase('pk'+(+i+1), 'bw');
            }
        }
    }
}

function cargarEquipoDuoEnUI(equipo) {
    for (let i = 0; i < 6; i++) {
        if (equipo[i]) {
            var elemento = document.getElementById('pk' + (+i + 1) + 'duo');
            elemento.src = equipo[i].sprite;
            if (equipo[i].morido) {
                agregarClase('pk' + (+i + 1) + 'duo', 'bw');
            }
        }
    }
}

init();