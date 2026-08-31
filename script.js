// Asteroid shooter game with realistic gravity
// Coded by Michael Schmidt Nissen, 2021

// Consts
// Gravitational constant
const G = 1000;

// Timestep, delta-time
const dt = 1 / 60;

const shipTurnRate = 4.0;
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

const trackedKeys = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'KeyQ',
    'KeyW',
    'KeyE',
    'KeyA',
    'KeyS',
    'KeyD',
    'KeyZ',
    'KeyX',
    'KeyC',
    'Space',
    'KeyH',
    'Numpad0',
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad7',
    'Numpad8',
    'Numpad9'
];

class Camera {
    constructor() {
        this.position = { x : 0, y : 0 };
        this.restPosition = { x : 0, y : 0 };
        this.zoom = 0.5;
        this.maxZoom = 1.0;
        this.minZoom = 0.1;
        this.deltaZoom = 0.05;
        this.zoomSpeed = 0.01;
        this.restZoom = 0.5;
    }

    update() {
        const zoomDiff = this.restZoom - this.zoom;
        this.zoom += zoomDiff * this.deltaZoom;
    }
}

class SpaceObject {
    constructor({ mass, radius = 0, angle = 0, angularVelocity = 0, image = 0, isAlive = true }) {
        this.position = { x : 0, y : 0 };
        this.velocity = { x : 0, y : 0 };
        this.force = { x : 0, y : 0 };
        this.angle = angle;
        this.angleVec = { x : 1, y : 0 };
        this.angularVelocity = angularVelocity;
        this.torque = 0;
        this.mass = mass;
        this.radius = radius;
        this.momentOfInertia = 100.0;
        this.image = image;
        this.isAlive = isAlive;
    }

    setCircularOrbit(centerObject, dist, angle) {
        const v = Math.sqrt((G * (this.mass + centerObject.mass)) / dist);

        this.position.x = dist * Math.cos(angle);
        this.position.y = dist * Math.sin(angle);
        this.velocity.x = -Math.sin(angle) * v;
        this.velocity.y = Math.cos(angle) * v;
    }

    updatePhysics() {
        if(this.isAlive === false) { return; }

        this.velocity.x += this.force.x / this.mass * dt;
        this.velocity.y += this.force.y / this.mass * dt;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        this.force.x = 0;
        this.force.y = 0;

        this.angularVelocity += this.torque / this.momentOfInertia * dt;
        this.angle += this.angularVelocity * dt;

        this.angleVec.x = Math.cos(this.angle);
        this.angleVec.y = Math.sin(this.angle);

        this.torque = 0;
    }
}

class Planet extends SpaceObject {
    constructor() {
        super({
            mass : 100000,
            angularVelocity : -0.03,
            image : 2
        });

        this.radius = ((3 * this.mass / 0.0001)/(4 * Math.PI)) ** (1/3);
    }
}

class Asteroid extends SpaceObject {
    constructor(planet) {
        super({
            mass : rnd(1, 20),
            angle : rnd(0, 2 * Math.PI),
            angularVelocity : rnd(-0.2, 0.2),
            image : getRandomInt(0, 6)
        });

        this.setCircularOrbit(planet, rnd(3500, 5500), rnd(0, 2 * Math.PI));
        this.radius = ((3 * this.mass / 0.00001)/(4 * Math.PI)) ** (1/3);
    }
}

class Ship extends SpaceObject {
    constructor(index, planet) {
        super({
            mass : 10,
            image : 7
        });

        this.coolDown = false;
        this.setCircularOrbit(planet, 3000, index * Math.PI);
        this.radius = ((3 * this.mass / 0.0001)/(4 * Math.PI)) ** (1/3);
    }

    fireBullet(game) {
        if(this.coolDown === true) { return; }

        const bullet = game.bullets.find((value) => value.isAlive === false);
        if(!bullet) { return; }

        bullet.isAlive = true;
        bullet.lifeTime = bulletLifeTime;
        bullet.position.x = this.position.x + this.angleVec.x * (this.radius + bullet.radius + 10);
        bullet.position.y = this.position.y + this.angleVec.y * (this.radius + bullet.radius + 10);
        bullet.velocity.x = this.velocity.x + this.angleVec.x * bulletSpeed;
        bullet.velocity.y = this.velocity.y + this.angleVec.y * bulletSpeed;
        this.coolDown = true;
        setTimeout(() => this.coolDown = false, timeBetweenBullets);
        //game.sounds[1].pause();
        game.sounds[1].currentTime = 0;
        game.sounds[1].play();
    }
}

class Bullet extends SpaceObject {
    constructor() {
        super({
            mass : 1,
            radius : bulletRadius,
            isAlive : false
        });

        this.lifeTime = 0;
    }

    updatePhysics() {
        if(this.isAlive === false) { return; }

        if(this.lifeTime > 0) {
            this.lifeTime -= dt;
            super.updatePhysics();
            return;
        }

        this.isAlive = false;
        this.lifeTime = bulletLifeTime;
    }
}

class Game {
    constructor() {
        this.asteroids = [];
        this.planets = [];
        this.bullets = [];
        this.ships = [];
        this.images = [];
        this.sounds = [];
        this.canvas = [];
        this.ctx = [];
        this.camera = [];
        this.keyState = {};
        this.lastTimestamp = 0;
        this.accumulator = 0;
        this.maxFrameTime = 0.25;

        this.mainLoop = this.mainLoop.bind(this);
        this.keyDown = this.keyDown.bind(this);
        this.keyUp = this.keyUp.bind(this);
    }

    start() {
        this.initInput();
        this.initCanvas();
        this.initAssets();
        this.initWorld();
        requestAnimationFrame(this.mainLoop);
    }

    initInput() {
        trackedKeys.forEach((key) => {
            this.keyState[key] = false;
        });

        window.addEventListener('keydown', this.keyDown);
        window.addEventListener('keyup', this.keyUp);
    }

    initCanvas() {
        this.canvas[0] = document.getElementById("canvas1");
        this.canvas[1] = document.getElementById("canvas2");

        this.ctx[0] = this.canvas[0].getContext("2d");
        this.ctx[1] = this.canvas[1].getContext("2d");

        for(let i = 0; i < 2; i++) {
            this.canvas[i].setAttribute('width', window.innerWidth * 0.5);
            this.canvas[i].setAttribute('height', window.innerHeight * 1);
            this.camera.push(new Camera());
        }
    }

    initAssets() {
        this.images = textureList.map((entry) => {
            const img = new Image();
            img.src = entry;
            return img;
        });

        this.sounds = soundList.map((entry) => {
            const sfx = new Audio();
            sfx.src = entry;
            return sfx;
        });
    }

    initWorld() {
        const planet = new Planet();
        this.planets.push(planet);

        for(let i = 0; i < 100; i++) {
            this.asteroids.push(new Asteroid(planet));
        }

        for(let i = 0; i < 2; i++) {
            this.ships.push(new Ship(i, planet));
        }

        for(let i = 0; i < 1000; i++) {
            this.bullets.push(new Bullet());
        }
    }

    mainLoop(timestamp) {
        if(this.lastTimestamp === 0) {
            this.lastTimestamp = timestamp;
        }

        const elapsed = Math.min((timestamp - this.lastTimestamp) / 1000, this.maxFrameTime);
        this.lastTimestamp = timestamp;
        this.accumulator += elapsed;

        while(this.accumulator >= dt) {
            this.update();
            this.accumulator -= dt;
        }

        this.renderScene();
        requestAnimationFrame(this.mainLoop);
    }

    update() {
        this.controlShip();

        this.calculateGravityAmong(this.asteroids);
        this.calculateGravityBetween(this.planets, this.asteroids);
        this.calculateGravityBetween(this.planets, this.bullets);
        this.calculateGravityBetween(this.planets, this.ships);

        this.updateState(this.planets);
        this.updateState(this.asteroids);
        this.updateState(this.ships);
        this.updateState(this.bullets);

        this.calculateCollisionAmong(this.bullets);
        this.calculateCollisionBetween(this.asteroids, this.bullets);
        this.calculateCollisionBetween(this.asteroids, this.ships);
        this.calculateCollisionBetween(this.bullets, this.ships);

        for(let i = 0; i < 2; i++) {
            this.camera[i].position.x = this.ships[i].position.x;
            this.camera[i].position.y = this.ships[i].position.y;
            this.camera[i].update();
        }
    }

    controlShip() {
        if(this.ships[0].isAlive === true) {
            if(this.keyState.KeyA === true) { this.turnShip(this.ships[0], -1); }
            if(this.keyState.KeyD === true) { this.turnShip(this.ships[0], 1); }
            if(this.keyState.KeyW === true) { this.thrustShip(this.ships[0]); }
            if(this.keyState.KeyS === true) { this.ships[0].fireBullet(this); }
            if(this.keyState.KeyQ === true) { this.zoomCamera(this.camera[0], -1); }
            if(this.keyState.KeyE === true) { this.zoomCamera(this.camera[0], 1); }
        }

        if(this.ships[1].isAlive === true) {
            if(this.keyState.Numpad4 === true) { this.turnShip(this.ships[1], -1); }
            if(this.keyState.Numpad6 === true) { this.turnShip(this.ships[1], 1); }
            if(this.keyState.Numpad8 === true) { this.thrustShip(this.ships[1]); }
            if(this.keyState.Numpad5 === true) { this.ships[1].fireBullet(this); }
            if(this.keyState.Numpad7 === true) { this.zoomCamera(this.camera[1], -1); }
            if(this.keyState.Numpad9 === true) { this.zoomCamera(this.camera[1], 1); }
        }
    }

    turnShip(ship, direction) {
        ship.angle += shipTurnRate * dt * direction;
        ship.angleVec.x = Math.cos(ship.angle);
        ship.angleVec.y = Math.sin(ship.angle);
    }

    thrustShip(ship) {
        ship.force.x += shipThrustForce * dt * ship.angleVec.x;
        ship.force.y += shipThrustForce * dt * ship.angleVec.y;
    }

    zoomCamera(camera, direction) {
        if(direction < 0) {
            camera.restZoom /= (1.0 + camera.zoomSpeed);
            if(camera.restZoom < camera.minZoom) { camera.restZoom = camera.minZoom; }
            return;
        }

        camera.restZoom *= (1.0 + camera.zoomSpeed);
        if(camera.restZoom > camera.maxZoom) { camera.restZoom = camera.maxZoom; }
    }

    calculateGravityAmong(array) {
        for(let i = 0; i < array.length - 1; i++) {
            if(array[i].isAlive === false) { continue; }

            for(let j = i + 1; j < array.length; j++) {
                if(array[j].isAlive === false) { continue; }

                const rSum = (array[i].radius + array[j].radius) * 0.5;
                const rx = array[j].position.x - array[i].position.x;
                const ry = array[j].position.y - array[i].position.y;
                const r2 = rx * rx + ry * ry;

                if(r2 < rSum * rSum) { continue; }

                const r = Math.sqrt(r2);
                const f = G * (array[i].mass * array[j].mass) / r2;
                const fx = f * rx / r;
                const fy = f * ry / r;

                array[i].force.x += fx;
                array[i].force.y += fy;

                array[j].force.x -= fx;
                array[j].force.y -= fy;
            }
        }
    }

    calculateGravityBetween(arrayA, arrayB) {
        for(let i = 0; i < arrayA.length; i++) {
            if(arrayA[i].isAlive === false) { continue; }

            for(let j = 0; j < arrayB.length; j++) {
                if(arrayB[j].isAlive === false) { continue; }

                const rSum = (arrayA[i].radius + arrayB[j].radius) * 0.5;
                const rx = arrayA[i].position.x - arrayB[j].position.x;
                const ry = arrayA[i].position.y - arrayB[j].position.y;
                const r2 = rx * rx + ry * ry;

                if(r2 < rSum * rSum) { continue; }

                const r = Math.sqrt(r2);
                const f = (G * arrayA[i].mass * arrayB[j].mass) / r2;
                const fx = f * rx / r;
                const fy = f * ry / r;

                arrayA[i].force.x -= fx;
                arrayA[i].force.y -= fy;

                arrayB[j].force.x += fx;
                arrayB[j].force.y += fy;
            }
        }
    }

    calculateCollisionAmong(array) {
        for(let i = 0; i < array.length - 1; i++) {
            if(array[i].isAlive === false) { continue; }

            for(let j = i + 1; j < array.length; j++) {
                if(array[j].isAlive === false) { continue; }

                const rx = array[i].position.x - array[j].position.x;
                const ry = array[i].position.y - array[j].position.y;
                const rSum = array[i].radius + array[j].radius;

                if((Math.abs(rx) > rSum) || (Math.abs(ry) > rSum)) { continue; }

                array[i].isAlive = false;
                array[j].isAlive = false;
            }
        }
    }

    calculateCollisionBetween(arrayA, arrayB) {
        for(let j = 0; j < arrayA.length; j++) {
            if(arrayA[j].isAlive === false) { continue; }

            for(let i = 0; i < arrayB.length; i++) {
                if(arrayB[i].isAlive === false) { continue; }

                const rx = arrayB[i].position.x - arrayA[j].position.x;
                const ry = arrayB[i].position.y - arrayA[j].position.y;
                const rSum = arrayB[i].radius + arrayA[j].radius;

                if((Math.abs(rx) > rSum) || (Math.abs(ry) > rSum)) { continue; }

                arrayB[i].isAlive = false;
                arrayA[j].isAlive = false;
            }
        }
    }

    updateState(array) {
        for(let i = 0; i < array.length; i++) {
            array[i].updatePhysics();
        }
    }

    renderScene() {
        for(let i = 0; i < 2; i++) {
            this.clearCanvas(i);
            this.applyCamera(i);

            this.renderBullets(i);
            this.renderAsteroids(i);
            this.renderShips(i);
            this.renderPlanets(i);

            this.showControls();
            this.ctx[i].restore();
        }
    }

    clearCanvas(index) {
        const ctx = this.ctx[index];

        ctx.resetTransform();
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this.canvas[index].width, this.canvas[index].height);
    }

    applyCamera(index) {
        const ctx = this.ctx[index];

        ctx.save();
        ctx.translate(this.canvas[index].width / 2, this.canvas[index].height / 2);
        ctx.scale(this.camera[index].zoom, this.camera[index].zoom);
        ctx.translate(-this.camera[index].position.x, -this.camera[index].position.y);
    }

    renderBullets(index) {
        const ctx = this.ctx[index];

        for(let j = 0; j < this.bullets.length; j++) {
            if(this.bullets[j].isAlive === false) { continue; }

            ctx.beginPath();
            ctx.arc(this.bullets[j].position.x, this.bullets[j].position.y, bulletRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.closePath();
        }
    }

    renderAsteroids(index) {
        for(let j = 0; j < this.asteroids.length; j++) {
            this.renderImageObject(index, this.asteroids[j], 1, 1, 0.25 * 2 * Math.PI);
        }
    }

    renderShips(index) {
        for(let j = 0; j < this.ships.length; j++) {
            this.renderImageObject(index, this.ships[j], 2, 1, 0);
        }
    }

    renderPlanets(index) {
        for(let j = 0; j < this.planets.length; j++) {
            this.renderImageObject(index, this.planets[j], 1, 1, 0.25 * 2 * Math.PI);
        }
    }

    renderImageObject(index, object, widthRadiusMultiplier, heightRadiusMultiplier, rotationOffset) {
        if(object.isAlive === false) { return; }

        const ctx = this.ctx[index];
        const img = this.images[object.image];
        const width = object.radius * 2 * widthRadiusMultiplier;
        const height = object.radius * 2 * heightRadiusMultiplier;

        ctx.save();
        ctx.translate(object.position.x, object.position.y);
        ctx.rotate(object.angle + rotationOffset);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
    }

    showControls() {
        this.ctx[0].resetTransform();
        this.ctx[0].font = "16px Arial";
        this.ctx[0].fillStyle = "white";

        if(this.keyState.KeyZ === true) {
            this.ctx[0].fillText("Q/E : Zoom in/out", 50, 50);
            this.ctx[0].fillText("A/D : Turn ship left/right", 50, 80);
            this.ctx[0].fillText("W : Thrust", 50, 110);
            this.ctx[0].fillText("S: Fire", 50, 140);
        }
        else {
            this.ctx[0].fillText("Press 'Z' to see controls", 50, 50);
        }

        this.ctx[1].resetTransform();
        this.ctx[1].font = "16px Arial";
        this.ctx[1].fillStyle = "white";

        if(this.keyState.Numpad0 === true) {
            this.ctx[1].fillText("Numpad 7/9 : Zoom in/out", 50, 50);
            this.ctx[1].fillText("Numpad 4/6 : Turn ship left/right", 50, 80);
            this.ctx[1].fillText("Numpad 8 : Thrust", 50, 110);
            this.ctx[1].fillText("Numpad 5: Fire", 50, 140);
        }
        else {
            this.ctx[1].fillText("Press 'Numpad 0' to see controls", 50, 50);
        }
    }

    keyDown(e) {
        if(this.keyState[e.code] === undefined) { return; }

        this.keyState[e.code] = true;
    }

    keyUp(e) {
        if(this.keyState[e.code] === undefined) { return; }

        this.keyState[e.code] = false;
    }
}

function rnd(min, max) {
    return Math.random() * (max ? (max - min) : min) + (max ? min : 0);
}

function getRandomInt(min, max) {
    // max and min inclusive
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const game = new Game();
game.start();
