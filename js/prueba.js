const MAX_POKEMON = 6;
let canal, duo, team = [], teamDuo = [], death = 0;

let commands = Array.from({ length: MAX_POKEMON }, (_, i) => `poke${i + 1}`);
let commandsDuo = [...commands];
let deathCommand = 'muertes';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase config
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

// Initialization
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    canal = urlParams.get('canal');
    duo = urlParams.get('duo');
    deathCommand = urlParams.get('deathCommand') || deathCommand;

    commands = generarComandos(urlParams.get('comando'), MAX_POKEMON);
    commandsDuo = generarComandos(urlParams.get('comandoduo'), MAX_POKEMON);

    cargarDatos(canal, setTeam);
    cargarDatos(duo, setTeamDuo);

    death = +localStorage.getItem('deathcount') || 0;
    updateDeathCount();

    ComfyJS.Init(canal, null, [canal, duo]);
}

function generarComandos(prefijo, cantidad) {
    return prefijo ? Array.from({ length: cantidad }, (_, i) => `${prefijo}${i + 1}`) : commands;
}

async function apiPokemon(poke) {
    var pokemon = await fetch('https://pokeapi.co/api/v2/pokemon/' + poke);
    if (pokemon.status != 404) return pokemon.json();
    else return 'Not Found';
}

// Fetch Pokémon data
async function consultarMonster(nombre, variantes) {
    const url = 'https://spriteserver.pmdcollab.org/graphql';
    const query = `
        query {
            searchMonster(monsterName: "${nombre}") {
                id
                forms {
                    name
                    fullPath
                    fullName
                }
            }
        }
    `;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });

    const resultado = await response.json();
    const monster = resultado.data.searchMonster[0];
    console.log(variantes);
    if (!variantes.length || variantes.length == 0) {
        return monster.forms[0].fullPath;
    }

    const form = monster.forms.find(f =>
        variantes.every(variant =>
            f.fullName.toLowerCase().includes(variant.toLowerCase()) || f.name.toLowerCase().includes(variant.toLowerCase())
        )
    );

    return form ? form.fullPath : monster.forms[0].fullPath;
}

// Set and update Pokémon for team
async function setPokemon(message, pos, isDuo = false) {
    const { input, variantes } = separarNombreYVariantes(message);
    let [num, nick] = input.trim().split(' ');
    if (!num) return clearPokemon(pos, isDuo);

    if (num === 'd') return markAsDead(pos, isDuo);

    const teamToUpdate = isDuo ? teamDuo : team;
    const setter = isDuo ? setTeamDuo : setTeam;

    /*const pokemon = await apiPokemon(num);
    if (pokemon == 'Not Found') return;*/
    if(isNumber(num)) {
        const pokemon = await apiPokemon(num);
        if(pokemon == 'Not Found') return;
        num = pokemon.species.name;
    }
    const pokemonId = await consultarMonster(num, variantes);

    const spriteUrl = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${pokemonId}/Normal.png`;
    const specie = num;

    teamToUpdate[pos] = { poke: num, sprite: spriteUrl, name: specie, nick: nick || specie };
    setter(teamToUpdate);
    guardarEquipoEnFirestore(canal, teamToUpdate);
}

function separarNombreYVariantes(cadena) {
    // Usamos una expresión regular para capturar las palabras precedidas por un guion
    const regex = /-(\w+)/g;
    let variantes = [];
    let match;

    // Mientras haya coincidencias, las agregamos al array de variantes
    while ((match = regex.exec(cadena)) !== null) {
        variantes.push(match[1]);
    }

    // Quitamos las variantes de la cadena original para obtener el nombre
    const input = cadena.replace(/-\w+/g, '').trim();

    return { input, variantes };
}

function clearPokemon(pos, isDuo) {
    const teamToUpdate = isDuo ? teamDuo : team;
    teamToUpdate[pos] = null;
    const setter = isDuo ? setTeamDuo : setTeam;
    setter(teamToUpdate);
    guardarEquipoEnFirestore(canal, teamToUpdate);
}

function setTeam(equipo) {
    team = equipo;
    localStorage.setItem('team', JSON.stringify(team));
    cargarEquipoEnUI(team);
}

function setTeamDuo(equipo) {
    teamDuo = equipo;
    localStorage.setItem('teamDuo', JSON.stringify(teamDuo));
    cargarEquipoEnUI(teamDuo, true);
}

function cargarEquipoEnUI(equipo, isDuo = false) {
    for (let i = 0; i < MAX_POKEMON; i++) {
        const elemento = document.getElementById(`pk${i + 1}${isDuo ? 'duo' : ''}`);
        const nickElement = document.getElementById(`nick${i + 1}`);

        if (equipo[i]) {
            elemento.src = equipo[i].sprite;
            if (!isDuo) nickElement.innerHTML = equipo[i].nick;
            if (equipo[i].morido) {
                agregarClase(`pk${i + 1}${isDuo ? 'duo' : ''}`, 'bw');
            } else {
                quitarClase(`pk${i + 1}${isDuo ? 'duo' : ''}`, 'bw');
            }
        } else {
            elemento.src = isDuo ? 'img/DuoBlank.png' : 'img/MainBlank.png';
            nickElement.innerHTML = '';
            quitarClase(`pk${i + 1}${isDuo ? 'duo' : ''}`, 'bw');
        }
    }
}

function markAsDead(pos, isDuo) {
    const teamToUpdate = isDuo ? teamDuo : team;
    teamToUpdate[pos].morido = true;
    agregarClase(`pk${pos + 1}${isDuo ? 'duo' : ''}`, 'bw');
    localStorage.setItem(isDuo ? 'teamDuo' : 'team', JSON.stringify(teamToUpdate));
}

// Save and load data
async function guardarEquipoEnFirestore(usuario, equipo) {
    try {
        await setDoc(doc(db, 'usuarios', usuario.toLowerCase()), { team: equipo });
        console.log("Equipo guardado correctamente en Firestore.");
    } catch (error) {
        console.error("Error al guardar equipo en Firestore: ", error);
    }
}

async function cargarDatos(usuario, setter) {
    const storedData = JSON.parse(localStorage.getItem(usuario)) || Array(MAX_POKEMON).fill(null);
    const userDocRef = doc(db, 'usuarios', usuario.toLowerCase());

    try {
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists()) {
            const data = docSnapshot.data().team || storedData;
            setter(data);
            localStorage.setItem(usuario, JSON.stringify(data));
        } else {
            setter(storedData);
            guardarEquipoEnFirestore(usuario, storedData);
        }
    } catch (error) {
        console.error("Error al obtener datos de Firestore: ", error);
        setter(storedData);
    }
}

// Utility functions
function completarConCeros(numero) {
    return numero.toString().padStart(4, '0');
}

function isNumber(value) {
    return typeof value === 'number' || !isNaN(value);
}

function updateDeathCount() {
    document.getElementById('death').innerText = `X${death}`;
    localStorage.setItem('deathcount', death);
}

function agregarClase(idElemento, nuevaClase) {
    const elemento = document.getElementById(idElemento);
    if (elemento) elemento.classList.add(nuevaClase);
}

function quitarClase(idElemento, clase) {
    var elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.classList.remove(clase);
    }
}

// ComfyJS Command handling
ComfyJS.onCommand = (user, command, message, flags, extra) => {
    if (!flags.broadcaster && !flags.mod) return;
    const index = commands.indexOf(command);

    if (extra.channel.toLowerCase() === canal.toLowerCase() && index !== -1) {
        setPokemon(message, index);
    }
    if (extra.channel.toLowerCase() === duo.toLowerCase() && index !== -1) {
        setPokemon(message, index, true);
    }

    if (command === deathCommand) {
        death = message ? +message.split(' ')[0] : death + 1;
        updateDeathCount();
    }
}

init();
