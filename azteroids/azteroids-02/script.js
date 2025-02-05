
// Asteroid shooter game with realistic gravity
// Coded by Michael Schmidt Nissen, 2021

// Consts
// Gravitational constant
const G = 500; 

// Timestep, delta-time
const dt = 1 / 60;

const shipTurnRate = 1.2;
const shipThrustForce = 20000;

const bulletSpeed = 300;
const bulletRadius = 5;
const bulletLifeTime = 60;
const timeBetweenBullets = 100;

const textureList = [
    'img/RTS_Crate.png', 
    'img/asteroid01.png', 
    'img/asteroid02.png', 
    'img/asteroid03.png', 
    'img/invaders01.png', 
    'img/invaders02.png', 
    'img/invaders03.png',
    'img/cartoon-rocket.png',
    'img/ship for aliens.png' 
];

const soundList = [
    'sfx/krakout bongball.wav',
    'sfx/q20.wav',
    'sfx/r15.wav'
];

// Arrays
const asteroids = [];
const planets = [];
const bullets = [];
const ships = [];
const images = [];
const sounds = [];
const canvas = [];
const ctx = [];
const camera = [];

// Canvas
canvas[0] = document.getElementById("canvas1");
canvas[1] = document.getElementById("canvas2");

// Context
ctx[0] = canvas[0].getContext("2d");
ctx[1] = canvas[1].getContext("2d");

initGame();

// run game loop
setInterval(mainLoop, dt);

// camera / viewport
for(let i = 0; i < 2; i++) {
        
    const cam = {
        position : { x : 0, y : 0 },
        restPosition : { x : 0, y : 0 },
        zoom: 0.5,
        maxZoom : 1.0,
        minZoom : 0.1,
        deltaZoom: 0.05,
        zoomSpeed: 0.01,
        restZoom: 0.5,
        update: function(){  
            
            let zoomDiff = this.restZoom - this.zoom;
            this.zoom += zoomDiff * this.deltaZoom;
        }
    };

    camera.push(cam);
}


// Keyboard input
const gameKeyState = {
    ArrowUp : false,
    ArrowDown : false,
    ArrowLeft : false,
    ArrowRight : false,
    KeyQ : false,
    KeyW : false,
    KeyE : false,
    KeyA : false,
    KeyS : false,
    KeyD : false,
    KeyZ : false,
    KeyX : false,
    KeyC : false,
    Space : false,
    KeyH : false,
    Numpad0 : false,
    Numpad1 : false,
    Numpad2 : false,
    Numpad3 : false,
    Numpad4 : false,
    Numpad5 : false,
    Numpad6 : false,
    Numpad7 : false,
    Numpad8 : false,
    Numpad9 : false,
}

// Functions
function initGame(){
    
    // Canvas & context
    for(let i = 0; i < 2; i++) {

        canvas[i].setAttribute('width', window.innerWidth * 0.45);
        canvas[i].setAttribute('height', window.innerHeight * 0.8);
    }
    
    // Load assets
    loadTextureListIntoArray(textureList, images);
    loadSoundListIntoArray(soundList, sounds);
    
    //
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    // Planet
    const planet = {
        position : { x : 0, y : 0 },
        velocity : { x : 0, y : 0 },
        force : { x : 0, y : 0 },
        angle : 0,
        angleVec : { x : 1, y : 0 },
        angularVelocity : -0.03,
        torque : 0,
        mass : 100000,
        radius : 0,
        momentOfInertia : 100.0,
        image : 2,
        isAlive : true
    };
    
    planet.radius = ((3 * planet.mass / 0.0001)/(4 * Math.PI)) ** (1/3);
    
    planets.push(planet);

    // Asteroids
    for(let i = 0 ; i < 100 ; i++) {

        const asteroid = {
            position : { x : 0, y : 0 },
            velocity : { x : 0, y : 0 },
            force : { x : 0, y : 0 },
            angle : rnd(0, 2 * Math.PI),
            angleVec : { x : 1, y : 0 },
            angularVelocity : rnd(-0.2, 0.2),
            torque : 0,
            mass : rnd(1, 20),
            radius : 0,
            momentOfInertia : 100.0,
            image : getRandomInt(0, 6),
            isAlive : true
        };
        
        // Circular orbit
        let dist = rnd(3500, 5500);
        let angle = rnd(0, 2 * Math.PI);
        let px = dist * Math.cos(angle);
        let py = dist * Math.sin(angle);
        let v = Math.sqrt( (G * (asteroid.mass + planets[0].mass) ) / dist );
        let vx = -Math.sin(angle) * v;
        let vy =  Math.cos(angle) * v;
    
        asteroid.position.x = px;
        asteroid.position.y = py;
    
        asteroid.velocity.x = vx;
        asteroid.velocity.y = vy;
    
        asteroid.radius = ((3 * asteroid.mass / 0.00001)/(4 * Math.PI)) ** (1/3);
    
        asteroids.push(asteroid);
    };

    for(let i = 0 ; i < 2; i++) {
            
        const ship = {
            position : { x : 0, y : 0 },
            velocity : { x : 0, y : 0 },
            force : { x : 0, y : 0 },
            angle : 0,
            angleVec : { x : 1, y : 0 },
            angularVelocity : 0.0,
            torque : 0,
            mass : 10,
            radius : 0,
            momentOfInertia : 100.0,
            image : 7,
            isAlive : true,
            coolDown : false,
            fireBullet : function(){
    
                if(this.coolDown === false) {
            
                    let bullet = bullets.find(firstAlive);
            
                    function firstAlive(value) {
                        return value.isAlive === false;
                    }
                    
                    bullet.isAlive = true;
                    bullet.lifeTime = bulletLifeTime;
                    bullet.position.x = this.position.x + this.angleVec.x * (this.radius + bullet.radius + 10);
                    bullet.position.y = this.position.y + this.angleVec.y * (this.radius + bullet.radius + 10);
                    bullet.velocity.x = this.velocity.x + this.angleVec.x * bulletSpeed;
                    bullet.velocity.y = this.velocity.y + this.angleVec.y * bulletSpeed;
                    this.coolDown = true;
                    setTimeout(() => this.coolDown = false, timeBetweenBullets);
                    //sounds[1].pause();
                    sounds[1].currentTime = 0;
                    sounds[1].play();
                }
            }
        };

        // Circular orbit
        let dist = 3000;
        let angle = i * Math.PI;
        let px = dist * Math.cos(angle);
        let py = dist * Math.sin(angle);
        let v = Math.sqrt( (G * (ship.mass + planets[0].mass) ) / dist );
        let vx = -Math.sin(angle) * v;
        let vy =  Math.cos(angle) * v;

        ship.position.x = px;
        ship.position.y = py;

        ship.velocity.x = vx;
        ship.velocity.y = vy;

        ship.radius = ((3 * ship.mass / 0.0001)/(4 * Math.PI)) ** (1/3);

        ships.push(ship);
    }
    
    // Bullets
    for(let i = 0 ; i < 1000 ; i++) {
    
        var bullet = {
            position : { x : 0, y : 0 },
            velocity : { x : 0, y : 0 },
            force : { x : 0, y : 0 },
            mass : 1,
            radius : bulletRadius,
            isAlive : false,
            lifeTime : 0,
            update : function() {
                if( this.lifeTime > 0 ){
                    this.lifeTime -= dt;
                    this.velocity.x += this.force.x / this.mass * dt;
                    this.velocity.y += this.force.y / this.mass * dt;
                    this.position.x += this.velocity.x * dt;
                    this.position.y += this.velocity.y * dt;
                    this.force.x = 0.0;
                    this.force.y = 0.0;
                }
                else {
                    this.isAlive = false;
                    this.lifeTime = bulletLifeTime;
                }
            }
        }
    
        bullets.push(bullet);
    };
}

function mainLoop() {

    controlShip();

    //calculateGravityAmong(asteroids);
    calculateGravityBetween(planets, asteroids);
    calculateGravityBetween(planets, bullets);
    calculateGravityBetween(planets, ships);

    updateState(planets);
    updateState(asteroids);
    updateState(ships);
    updateBullets();
    
    calculateCollisionAmong(bullets);
    calculateCollisionBetween(asteroids, bullets);
    calculateCollisionBetween(asteroids, ships);
    calculateCollisionBetween(bullets, ships);
  

    for(let i = 0; i < 2; i++) {
        
        camera[i].position.x = ships[i].position.x;
        camera[i].position.y = ships[i].position.y;
        camera[i].update();
    }

    requestAnimationFrame(renderScene);
}

function controlShip() {

    if(ships[0].isAlive === true){

        if (gameKeyState.KeyA === true) {ships[0].angle -= shipTurnRate * dt; ships[0].angleVec.x = Math.cos(ships[0].angle ); ships[0].angleVec.y = Math.sin(ships[0].angle );}
        if (gameKeyState.KeyD === true) {ships[0].angle += shipTurnRate * dt; ships[0].angleVec.x = Math.cos(ships[0].angle ); ships[0].angleVec.y = Math.sin(ships[0].angle ); }
        if (gameKeyState.KeyW === true) {
            ships[0].force.x += shipThrustForce * dt * ships[0].angleVec.x; 
            ships[0].force.y += shipThrustForce * dt * ships[0].angleVec.y;
        }
        if (gameKeyState.KeyS === true) { ships[0].fireBullet(); }
        if (gameKeyState.KeyQ === true) { camera[0].restZoom /= (1.0 + camera[0].zoomSpeed); if(camera[0].restZoom < camera[0].minZoom) {camera[0].restZoom = camera[0].minZoom} };
        if (gameKeyState.KeyE === true) { camera[0].restZoom *= (1.0 + camera[0].zoomSpeed); if(camera[0].restZoom > camera[0].maxZoom) {camera[0].restZoom = camera[0].maxZoom} }; 
    }

    if(ships[1].isAlive === true){
        
        if (gameKeyState.Numpad4 === true) {ships[1].angle -= shipTurnRate * dt; ships[1].angleVec.x = Math.cos(ships[1].angle ); ships[1].angleVec.y = Math.sin(ships[1].angle );}
        if (gameKeyState.Numpad6 === true) {ships[1].angle += shipTurnRate * dt; ships[1].angleVec.x = Math.cos(ships[1].angle ); ships[1].angleVec.y = Math.sin(ships[1].angle ); }
        if (gameKeyState.Numpad8 === true) {
            ships[1].force.x += shipThrustForce * dt * ships[1].angleVec.x; 
            ships[1].force.y += shipThrustForce * dt * ships[1].angleVec.y;
        }
        if (gameKeyState.Numpad5 === true) { ships[1].fireBullet(); }
        if (gameKeyState.Numpad7 === true) { camera[1].restZoom /= (1.0 + camera[1].zoomSpeed); if(camera[1].restZoom < camera[1].minZoom) {camera[1].restZoom = camera[1].minZoom} };
        if (gameKeyState.Numpad9 === true) { camera[1].restZoom *= (1.0 + camera[1].zoomSpeed); if(camera[1].restZoom > camera[1].maxZoom) {camera[1].restZoom = camera[1].maxZoom} }; 
    }
};

function rnd(min,max) {
    return Math.random() * (max ? (max-min) : min) + (max ? min : 0) 
}

function getRandomInt(min, max) {
     //max and min inclusive
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

function loadTextureListIntoArray(list, array) {
    list.forEach(entry => {
        var img = new Image();
        img.src = entry;
        array.push(img);
    });
}

function loadSoundListIntoArray(list, array) {
    list.forEach(entry => {
        var sfx = new Audio();
        sfx.src = entry;
        array.push(sfx);
    });
}

function renderScene() {

    
    for( let i = 0; i < 2 ; i++) {

        // clear screen
        ctx[i].resetTransform();
        ctx[i].fillStyle = "black";
        ctx[i].fillRect(0, 0, canvas[i].width, canvas[i].height);

        // Bullets
        for(let j = 0 ; j < bullets.length ; j++) {
            
            if(bullets[j].isAlive === false ) { continue;}
                
            var x = (bullets[j].position.x - camera[i].position.x) * camera[i].zoom + canvas[i].width/2;
            var y = (bullets[j].position.y - camera[i].position.y) * camera[i].zoom + canvas[i].height/2;
            ctx[i].setTransform(1, 0, 0, 1, x, y);
            ctx[i].beginPath();
            ctx[i].arc(0, 0, bulletRadius * camera[i].zoom, 0, Math.PI*2);
            ctx[i].fillStyle = "#FFFFFF";
            ctx[i].fill();
            ctx[i].closePath();
        }

        // asteroids
        for(let j = 0 ; j < asteroids.length ; j++) {

            if(asteroids[j].isAlive === false) {continue;}
            
            var img = images[asteroids[j].image];
            var x = (asteroids[j].position.x - camera[i].position.x) * camera[i].zoom + canvas[i].width/2;
            var y = (asteroids[j].position.y - camera[i].position.y) * camera[i].zoom + canvas[i].height/2;
            ctx[i].setTransform(1, 0, 0, 1, x, y);
            ctx[i].rotate(asteroids[j].angle + 0.25 * 2 * Math.PI);
            ctx[i].drawImage(img, -asteroids[j].radius * camera[i].zoom, -asteroids[j].radius * camera[i].zoom, asteroids[j].radius*2 * camera[i].zoom, asteroids[j].radius*2 * camera[i].zoom);
        }

        // ship
        for(let j = 0 ; j < ships.length ; j++) {

            if(ships[j].isAlive === false) {continue;}
            
            var img = images[ships[j].image];
            var x = (ships[j].position.x - camera[i].position.x) * camera[i].zoom + canvas[i].width/2;
            var y = (ships[j].position.y - camera[i].position.y) * camera[i].zoom + canvas[i].height/2;
            ctx[i].setTransform(1, 0, 0, 1, x, y);
            ctx[i].rotate(ships[j].angle);
            ctx[i].drawImage(img, -ships[j].radius * 2 * camera[i].zoom, -ships[j].radius * camera[i].zoom, ships[j].radius*4 * camera[i].zoom, ships[j].radius*2 * camera[i].zoom);
        }

        // Planets
        for(let j = 0 ; j < planets.length ; j++) {

            if(planets[j].isAlive === false) {continue;}
            
            var img = images[planets[j].image];
            var x = (planets[j].position.x - camera[i].position.x) * camera[i].zoom + canvas[i].width/2;
            var y = (planets[j].position.y - camera[i].position.y) * camera[i].zoom + canvas[i].height/2;
            ctx[i].setTransform(1, 0, 0, 1, x, y);
            ctx[i].rotate(planets[j].angle + 0.25 * 2 * Math.PI);
            ctx[i].drawImage(img, -planets[j].radius * camera[i].zoom, -planets[j].radius * camera[i].zoom, planets[j].radius*2 * camera[i].zoom, planets[j].radius*2 * camera[i].zoom);
        }
        
        showControls();

    }
}

function showControls() {
    
    ctx[0].resetTransform();
    ctx[0].font = "16px Arial";
    ctx[0].fillStyle = "white";

    if(gameKeyState.KeyZ === true){
        
        ctx[0].fillText("Q/E : Zoom in/out", 50, 50);
        ctx[0].fillText("A/D : Turn ship left/right", 50, 80);
        ctx[0].fillText("W : Thrust", 50, 110);
        ctx[0].fillText("S: Fire", 50, 140);
    }
    else
    {
        ctx[0].fillText("Press 'Z' to see controls", 50, 50);
    }

    ctx[1].resetTransform();
    ctx[1].font = "16px Arial";
    ctx[1].fillStyle = "white";

    if(gameKeyState.Numpad0 === true){
        
        ctx[1].fillText("Numpad 7/9 : Zoom in/out", 50, 50);
        ctx[1].fillText("Numpad 4/6 : Turn ship left/right", 50, 80);
        ctx[1].fillText("Numpad 8 : Thrust", 50, 110);
        ctx[1].fillText("Numpad 5: Fire", 50, 140);
    }
    else
    {
        ctx[1].fillText("Press 'Numpad 0' to see controls", 50, 50);
    }
}

function calculateGravityAmong(array)
{
    for(let i = 0 ; i < array.length-1 ; i++) {

        if(array[i].isAlive === false) {continue;}

        for(let j = i+1 ; j < array.length ; j++ ) {

            if(array[j].isAlive === false) {continue;}

            const rSum = (array[i].radius + array[j].radius) * 0.5;

            // distance vector
            const rx = array[j].position.x - array[i].position.x;
            const ry = array[j].position.y - array[i].position.y; 

            // distance squared
            const r2 = rx*rx+ry*ry;

            if (r2 < rSum*rSum) { continue; }

            // distance scalar
            const r = Math.sqrt(r2);

            // force scalar
            const f = G * (array[i].mass * array[j].mass) / r2;

            // force vector
            const fx = f * rx / r;
            const fy = f * ry / r;

            // apply force
            array[i].force.x += fx;
            array[i].force.y += fy;

            array[j].force.x -= fx;
            array[j].force.y -= fy;
        };
    };
}

function calculateGravityBetween(arrayA, arrayB)
{
    for(let i = 0 ; i < arrayA.length ; i++) {

        if(arrayA[i].isAlive === false) {continue;}

        for(let j = 0 ; j < arrayB.length ; j++ ) {

            if(arrayB[j].isAlive === false) {continue;}

            const rSum = (arrayA[i].radius + arrayB[j].radius) * 0.5;

            // distance vector
            const rx = arrayA[i].position.x - arrayB[j].position.x;
            const ry = arrayA[i].position.y - arrayB[j].position.y;

            // distance squared
            const r2 = rx*rx+ry*ry;

            if (r2 < rSum*rSum) { continue; }

            // distance scalar
            const r = Math.sqrt(r2);

            // force scalar
            const f = (G * arrayA[i].mass * arrayB[j].mass) / r2;

            // force  vector
            const fx = f * rx / r;
            const fy = f * ry / r;

            // apply force
            arrayA[i].force.x -= fx;
            arrayA[i].force.y -= fy;

            arrayB[j].force.x += fx;
            arrayB[j].force.y += fy;
        };
    };
}

function calculateCollisionAmong(array){

    for(let i = 0 ; i < array.length-1 ; i++) {

        if(array[i].isAlive === false) {continue;}

        for(let j = i+1 ; j < array.length ; j++ ) {

            if(array[j].isAlive === false) {continue;}

            let rx = array[i].position.x - array[j].position.x;
            let ry = array[i].position.y - array[j].position.y;

            let r2 = rx*rx+ry*ry;

            let rSum = array[i].radius + array[j].radius;

            if ((Math.abs(rx) > rSum) || (Math.abs(ry) > rSum) ) { continue; } // Works

            array[i].isAlive = false;
            array[j].isAlive = false;
        }
    }
}

function calculateCollisionBetween(arrayA, arrayB){

    for( let j = 0 ; j < arrayA.length ; j++){

        if(arrayA[j].isAlive === false) {continue;}

        for( let i = 0 ; i < arrayB.length ; i++){

            if(arrayB[i].isAlive === false) {continue;}

            let rx = arrayB[i].position.x - arrayA[j].position.x;
            let ry = arrayB[i].position.y - arrayA[j].position.y;

            let r2 = rx*rx+ry*ry;

            let rSum = arrayB[i].radius + arrayA[j].radius;

            if ((Math.abs(rx) > rSum) || (Math.abs(ry) > rSum) ) { continue; } // Works

            arrayB[i].isAlive = false;
            arrayA[j].isAlive = false;
        }
    }
}

function updateState(array) {

    for(let i = 0 ; i < array.length ; i++) {

        if(array[i].isAlive === false) {continue;}

        //
        array[i].velocity.x += array[i].force.x / array[i].mass * dt;
        array[i].velocity.y += array[i].force.y / array[i].mass * dt;

        array[i].position.x += array[i].velocity.x * dt;
        array[i].position.y += array[i].velocity.y * dt;

        array[i].force.x = 0;
        array[i].force.y = 0;

        //
        array[i].angularVelocity += array[i].torque / array[i].momentOfInertia * dt;

        array[i].angle += array[i].angularVelocity * dt;

        array[i].angleVec.x = Math.cos(array[i].angle ); 
        array[i].angleVec.y = Math.sin(array[i].angle );

        array[i].torque = 0;
    };
}

function updateBullets() {
    
    for(let i = 0 ; i < bullets.length ; i++) {

        if(bullets[i].isAlive === false) {continue;}
            
        bullets[i].update();
    }
}

function keyDown(e){
    
    switch(e.code) {
        case 'KeyQ': gameKeyState.KeyQ = true; break;
        case 'KeyW': gameKeyState.KeyW = true; break;
        case 'KeyE': gameKeyState.KeyE = true; break;
        case 'KeyA': gameKeyState.KeyA = true; break;
        case 'KeyS': gameKeyState.KeyS = true; break;
        case 'KeyD': gameKeyState.KeyD = true; break;
        case 'KeyZ': gameKeyState.KeyZ = true; break;
        case 'KeyX': gameKeyState.KeyX = true; break;
        case 'KeyC': gameKeyState.KeyC = true; break;
        case 'KeyH': gameKeyState.KeyH = true; break;
        case 'Space': gameKeyState.Space = true; break;
        case 'Numpad0': gameKeyState.Numpad0 = true; break;
        case 'Numpad1': gameKeyState.Numpad1 = true; break;
        case 'Numpad2': gameKeyState.Numpad2 = true; break;
        case 'Numpad3': gameKeyState.Numpad3 = true; break;
        case 'Numpad4': gameKeyState.Numpad4 = true; break;
        case 'Numpad5': gameKeyState.Numpad5 = true; break;
        case 'Numpad6': gameKeyState.Numpad6 = true; break;
        case 'Numpad7': gameKeyState.Numpad7 = true; break;
        case 'Numpad8': gameKeyState.Numpad8 = true; break;
        case 'Numpad9': gameKeyState.Numpad9 = true; break;
        case 'ArrowUp': gameKeyState.ArrowUp = true; break;
        case 'ArrowDown': gameKeyState.ArrowDown = true; break;
        case 'ArrowLeft': gameKeyState.ArrowLeft = true; break;
        case 'ArrowRight': gameKeyState.ArrowRight = true; break;
    }
};

function keyUp(e){
    
    switch(e.code) {
        case 'KeyQ': gameKeyState.KeyQ = false; break;
        case 'KeyW': gameKeyState.KeyW = false; break;
        case 'KeyE': gameKeyState.KeyE = false; break;
        case 'KeyA': gameKeyState.KeyA = false; break;
        case 'KeyS': gameKeyState.KeyS = false; break;
        case 'KeyD': gameKeyState.KeyD = false; break;
        case 'KeyZ': gameKeyState.KeyZ = false; break;
        case 'KeyX': gameKeyState.KeyX = false; break;
        case 'KeyC': gameKeyState.KeyC = false; break;
        case 'KeyH': gameKeyState.KeyH = false; break;
        case 'Space': gameKeyState.Space = false; break;
        case 'Numpad0': gameKeyState.Numpad0 = false; break;
        case 'Numpad1': gameKeyState.Numpad1 = false; break;
        case 'Numpad2': gameKeyState.Numpad2 = false; break;
        case 'Numpad3': gameKeyState.Numpad3 = false; break;
        case 'Numpad4': gameKeyState.Numpad4 = false; break;
        case 'Numpad5': gameKeyState.Numpad5 = false; break;
        case 'Numpad6': gameKeyState.Numpad6 = false; break;
        case 'Numpad7': gameKeyState.Numpad7 = false; break;
        case 'Numpad8': gameKeyState.Numpad8 = false; break;
        case 'Numpad9': gameKeyState.Numpad9 = false; break;
        case 'ArrowUp': gameKeyState.ArrowUp = false; break;
        case 'ArrowDown': gameKeyState.ArrowDown = false; break;
        case 'ArrowLeft': gameKeyState.ArrowLeft = false; break;
        case 'ArrowRight': gameKeyState.ArrowRight = false; break;
    }

};
