
// Asteroid shooter game with realistic gravity
// Coded by Michael Schmidt Nissen, 2021

// Consts
// Gravitational constant
const G = 1000; 

// Timestep, delta-time
const dt = 1 / 60;

const shipTurnRate = 1.2;
const shipThrustForce = 20000;

const bulletSpeed = 500;
const bulletRadius = 5;
const bulletLifeTime = 5;
const timeBetweenBullets = 100;
let coolDown = false;

const textureList = [
    'img/RTS_Crate.png', 
    'img/asteroid01.png', 
    'img/asteroid02.png', 
    'img/asteroid03.png', 
    'img/invaders01.png', 
    'img/invaders02.png', 
    'img/invaders03.png',
    'img/cartoon-rocket.png',
    'img/spaceship for aliens.png' 
];

const soundList = [
    'sfx/krakout bongball.wav',
    'sfx/q20.wav',
    'sfx/r15.wav'
];

// Arrays
const objects = [];
const bullets = [];
const images = [];
const sounds = [];

// Canvas
const canvas = document.getElementById("myCanvas");

// Context
const ctx = canvas.getContext("2d");

initGame();

//
const spaceship = objects[objects.length-1];

// run game loop
setInterval(mainLoop, dt);

// Camera / viewport
const camera = {
    position : { x : 0, y : 0 },
    restPosition : { x : 0, y : 0 },
    deltaPosition: 0.1,
    zoom: 0.0,
    maxZoom : 2.0,
    minZoom : 0.01,
    deltaZoom: 0.1,
    zoomSpeed: 0.01,
    restZoom: 1.0,
    input : function(){

        if(gameKeyState.ArrowUp)    {this.restPosition.y -= (screen.height/4) / this.zoom}
        if(gameKeyState.ArrowDown)  {this.restPosition.y += (screen.height/4) / this.zoom}
        if(gameKeyState.ArrowLeft)  {this.restPosition.x -= (screen.height/4) / this.zoom}
        if(gameKeyState.ArrowRight) {this.restPosition.x += (screen.height/4) / this.zoom}
        if(gameKeyState.q) { this.restZoom /= (1.0 + this.zoomSpeed); if(this.restZoom < this.minZoom) {this.restZoom = this.minZoom} };
        if(gameKeyState.e) { this.restZoom *= (1.0 + this.zoomSpeed); if(this.restZoom > this.maxZoom) {this.restZoom = this.maxZoom} }; 
    },
    update: function(){  
        
        let zoomDiff = this.restZoom - this.zoom;
        this.zoom += zoomDiff * this.deltaZoom;

        let positionDiffX = this.restPosition.x - this.position.x;
        let positionDiffY = this.restPosition.y - this.position.y;
        this.position.x += positionDiffX * this.deltaPosition;
        this.position.y += positionDiffY * this.deltaPosition;
    }
};

// Keyboard input
const gameKeyState = {
    ArrowUp : false,
    ArrowDown : false,
    ArrowLeft : false,
    ArrowRight : false,
    q : false,
    w : false,
    e : false,
    a : false,
    s : false, s_prev: false,
    d : false,
    z : false,
    x : false,
    c : false,
    h : false,
    update : function() {
        this.s_prev = this.s;
    }
}

// Functions
function initGame(){
    
    // Canvas & context
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
    ctx.imageSmoothingEnabled = true;
    document.getElementById("myCanvas").focus();

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
        angularVelocity : 0.05,
        torque : 0,
        mass : 100000,
        radius : 0,
        momentOfInertia : 100.0,
        image : 2,
        isAlive : true
    };
    
    planet.radius = ((3 * planet.mass / 0.00001)/(4 * Math.PI)) ** (1/3);
    
    objects.push(planet);

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
        let dist = rnd(4500, 5500);
        let angle = rnd(0, 2 * Math.PI);
        let px = dist * Math.cos(angle);
        let py = dist * Math.sin(angle);
        let v = Math.sqrt( (G * (asteroid.mass + planet.mass) ) / dist );
        let vx = -Math.sin(angle) * v;
        let vy =  Math.cos(angle) * v;
    
        asteroid.position.x = px;
        asteroid.position.y = py;
    
        asteroid.velocity.x = vx;
        asteroid.velocity.y = vy;
    
        asteroid.radius = ((3 * asteroid.mass / 0.00001)/(4 * Math.PI)) ** (1/3);
    
        objects.push(asteroid);
    };

    const spaceship = {
        position : { x : 0, y : 0 },
        velocity : { x : 0, y : 0 },
        force : { x : 0, y : 0 },
        angle : 0,
        angleVec : { x : 1, y : 0 },
        angularVelocity : 0,
        torque : 0,
        mass : 10,
        radius : 0,
        momentOfInertia : 100.0,
        image : 7,
        isAlive : true
    };

    // Circular orbit
    let dist = rnd(2000, 3000);
    let angle = rnd(0, 2 * Math.PI);
    let px = dist * Math.cos(angle);
    let py = dist * Math.sin(angle);
    let v = Math.sqrt( (G * (spaceship.mass + planet.mass) ) / dist );
    let vx = -Math.sin(angle) * v;
    let vy =  Math.cos(angle) * v;

    spaceship.position.x = px;
    spaceship.position.y = py;

    spaceship.velocity.x = vx;
    spaceship.velocity.y = vy;

    spaceship.radius = ((3 * spaceship.mass / 0.0001)/(4 * Math.PI)) ** (1/3);

    objects.push(spaceship);
    
    // Bullets
    for(let i = 0 ; i < 100 ; i++) {
    
        var bullet = {
            position : { x : 0, y : 0 },
            velocity : { x : 0, y : 0 },
            force : { x : 0, y : 0 },
            mass : 1,
            radius : bulletRadius,
            isAlive : false,
            lifeTime : 0,
            init : function() {
                this.isAlive = true;
                this.lifeTime = bulletLifeTime;
                this.position.x = spaceship.position.x;
                this.position.y = spaceship.position.y;
                this.velocity.x = spaceship.velocity.x + spaceship.angleVec.x * bulletSpeed;
                this.velocity.y = spaceship.velocity.y + spaceship.angleVec.y * bulletSpeed;
                coolDown = true;
            },
            update : function() {
                if( this.lifeTime > 0 ){
                    this.lifeTime -= dt;
                    this.position.x += this.velocity.x * dt;
                    this.position.y += this.velocity.y * dt;
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

    calculateGravityAmong(objects);
    calculateGravityBetween(objects, bullets);

    updateState(objects);

    updateBullets();

    calculateCollision();

    camera.restPosition.x = spaceship.position.x + spaceship.velocity.x * dt * 10 * camera.zoom;
    camera.restPosition.y = spaceship.position.y + spaceship.velocity.y * dt * 10 * camera.zoom;
    
    camera.input();
    camera.update();

    //cx = spaceship.position.x + (mx - screen.width/2) / zoom;
    //cy = spaceship.position.y + (my - screen.height/2) / zoom;

    requestAnimationFrame(renderObjects);
}

function controlShip() {

    if (gameKeyState.a === true) {spaceship.angle -= shipTurnRate * dt; spaceship.angleVec.x = Math.cos(spaceship.angle ); spaceship.angleVec.y = Math.sin(spaceship.angle );}
    if (gameKeyState.d === true) {spaceship.angle += shipTurnRate * dt; spaceship.angleVec.x = Math.cos(spaceship.angle ); spaceship.angleVec.y = Math.sin(spaceship.angle ); }
    if (gameKeyState.w === true) {
        spaceship.force.x += shipThrustForce * dt * spaceship.angleVec.x; 
        spaceship.force.y += shipThrustForce * dt * spaceship.angleVec.y;
    }
    if (gameKeyState.s === true) { fireBullet(); }
    if (gameKeyState.z === true) { initGame(); }
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

function showScore(){

    ctx.resetTransform();
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";

    ctx.fillText("Asteroids left: " + (objects.filter(a => a.isAlive === true).length - 2), screen.width * 0.5, 50);
}

function showControls() {
    
    ctx.resetTransform();
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";

    if(gameKeyState.h === true){
        
        ctx.fillText("Q/E : Zoom in/out", 150, 50);
        ctx.fillText("A/D : Turn ship left/right", 150, 80);
        ctx.fillText("W : Thrust", 150, 110);
        ctx.fillText("S: Fire", 150, 140);
        ctx.fillText("Arrow keys: Look around", 150, 170);
    }
    else
    {
        ctx.fillText("Press 'H' to see controls", 150, 50);
    }
}

function renderObjects() {

    // clear screen
    ctx.resetTransform();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bullets
    for(let i = 0 ; i < bullets.length ; i++) {
        
        if(bullets[i].isAlive === false ){ continue;}
            
            var x = (bullets[i].position.x - camera.position.x) * camera.zoom + canvas.width/2;
            var y = (bullets[i].position.y - camera.position.y) * camera.zoom + canvas.height/2;
            ctx.setTransform(1, 0, 0, 1, x, y);
            ctx.beginPath();
            ctx.arc(0, 0, bulletRadius * camera.zoom, 0, Math.PI*2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.closePath();
    }

    /*
    // object hitbox
    for(let i = 0 ; i < objects.length ; i++) {

        if(objects[i].isAlive === false) {continue;}
        
        var x = (objects[i].position.x - camera.position.x) * camera.zoom + canvas.width/2;
        var y = (objects[i].position.y - camera.position.y) * camera.zoom + canvas.height/2;
        ctx.setTransform(1, 0, 0, 1, x, y);
        ctx.beginPath();
        ctx.arc(0, 0, objects[i].radius * camera.zoom, 0, Math.PI*2);
        ctx.fillStyle = "#0095DD22";
        ctx.fill();
        ctx.closePath();
    }
    */

    // object sprite
    for(let i = 0 ; i < objects.length-1 ; i++) {

        if(objects[i].isAlive === false) {continue;}
        
        var img = images[objects[i].image];
        var x = (objects[i].position.x - camera.position.x) * camera.zoom + canvas.width/2;
        var y = (objects[i].position.y - camera.position.y) * camera.zoom + canvas.height/2;
        ctx.setTransform(1, 0, 0, 1, x, y);
        ctx.rotate(objects[i].angle + 0.25 * 2 * Math.PI);
        ctx.drawImage(img, -objects[i].radius * camera.zoom, -objects[i].radius * camera.zoom, objects[i].radius*2 * camera.zoom, objects[i].radius*2 * camera.zoom);
    }

    // ship
    var img = images[spaceship.image];
    var x = (spaceship.position.x - camera.position.x) * camera.zoom + canvas.width/2;
    var y = (spaceship.position.y - camera.position.y) * camera.zoom + canvas.height/2;
    ctx.setTransform(1, 0, 0, 1, x, y);
    ctx.rotate(spaceship.angle);
    ctx.drawImage(img, -spaceship.radius * 2 * camera.zoom, -spaceship.radius * camera.zoom, spaceship.radius*4 * camera.zoom, spaceship.radius*2 * camera.zoom);

    // text
    showControls();
    showScore();
}

function fireBullet(){
    
    if(coolDown === false) {

        let bullet = bullets.find(firstAlive);

        function firstAlive(value) {
            return value.isAlive === false;
        }
        
        bullet.init();
        coolDown = true;
        setTimeout(() => coolDown = false, timeBetweenBullets);
        //sounds[1].pause();
        sounds[1].currentTime = 0;
        sounds[1].play();
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

            //if ( Math.abs(rx) < rSum ) { continue; }

            const ry = array[j].position.y - array[i].position.y;

            //if ( Math.abs(ry) < rSum ) { continue; }    

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
            
            //if ( Math.abs(rx) < rSum ) { continue; }

            const ry = arrayA[i].position.y - arrayB[j].position.y;

            //if ( Math.abs(ry) < rSum ) { continue; }

            //if ((!Math.abs(rx) > rSum) && (!Math.abs(ry) > rSum) ) { continue; }

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

function calculateCollision(){

    for( let j = 0 ; j < bullets.length ; j++){

        if(bullets[j].isAlive === false) {continue;}

        for( let i = 1 ; i < objects.length-1 ; i++){

            if(objects[i].isAlive === false) {continue;}

            let rx = objects[i].position.x - bullets[j].position.x;
            let ry = objects[i].position.y - bullets[j].position.y;

            let r2 = rx*rx+ry*ry;

            let rSum = objects[i].radius + bulletRadius;

            if ((Math.abs(rx) > rSum) || (Math.abs(ry) > rSum) ) { continue; } // Works

            objects[i].isAlive = false;
            bullets[j].isAlive = false;
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

        //objects[i].angleVec.x = Math.cos(objects[i].angle ); 
        //objects[i].angleVec.y = Math.sin(objects[i].angle );

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
    
    switch(e.key) {
        case 'q': gameKeyState.q = true; break;
        case 'w': gameKeyState.w = true; break;
        case 'e': gameKeyState.e = true; break;
        case 'a': gameKeyState.a = true; break;
        case 's': gameKeyState.s = true; break;
        case 'd': gameKeyState.d = true; break;
        case 'z': gameKeyState.z = true; break;
        case 'x': gameKeyState.x = true; break;
        case 'c': gameKeyState.c = true; break;
        case 'h': gameKeyState.h = true; break;
        case 'ArrowUp': gameKeyState.ArrowUp = true; break;
        case 'ArrowDown': gameKeyState.ArrowDown = true; break;
        case 'ArrowLeft': gameKeyState.ArrowLeft = true; break;
        case 'ArrowRight': gameKeyState.ArrowRight = true; break;
        case ' ': gameKeyState.Space = true; break;
    }
};

function keyUp(e){
    
    switch(e.key) {
        case 'q': gameKeyState.q = false; break;
        case 'w': gameKeyState.w = false; break;
        case 'e': gameKeyState.e = false; break;
        case 'a': gameKeyState.a = false; break;
        case 's': gameKeyState.s = false; break;
        case 'd': gameKeyState.d = false; break;
        case 'z': gameKeyState.z = false; break;
        case 'x': gameKeyState.x = false; break;
        case 'c': gameKeyState.c = false; break;
        case 'h': gameKeyState.h = false; break;
        case 'ArrowUp': gameKeyState.ArrowUp = false; break;
        case 'ArrowDown': gameKeyState.ArrowDown = false; break;
        case 'ArrowLeft': gameKeyState.ArrowLeft = false; break;
        case 'ArrowRight': gameKeyState.ArrowRight = false; break;
        case ' ': gameKeyState.Space = false; break;
    }

    gameKeyState.update();
};
