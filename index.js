'use strict';

var gravityConstant = 6.674 * Math.pow(10, -11);
var sunMass = Math.pow(10, 6);
var sunRadius = 0.05;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var scale;

function resizeCanvas() {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  scale = Math.min(canvas.width, canvas.height);
}
resizeCanvas();

window.addEventListener('resize', resizeCanvas, false);

function drawPlanets(planets, color) {
  ctx.fillStyle = color;
  var dimentions = [canvas.width, canvas.height];
  for (var i = 0; i < planets.length; i++) {
    var planet = planets[i];
    ctx.beginPath();
    ctx.arc.apply(ctx, planet.coords.map((n, i) => Math.pow(-1, i) * n * scale / 2 + dimentions[i] / 2).concat([planet.radius * scale, 0, 2*Math.PI]));
    ctx.fill();
  }
}

var oldPlanets;
var planets = [];

function findPlanetNear(coords, tolerance) {
  // Iterate in reverse to represent render order
  for (var i = planets.length - 1; i >= 0; i--) {
    var planet = planets[i];
    var offset = coords.map((n, i) => n - planet.coords[i]);
    if (Math.hypot.apply(Math, offset) < planet.radius + tolerance) {
      return { planet, offset };
    }
  }
}

function scaleCoords(coords) {
  return [2 * (coords[0] - canvas.width / 2) / scale, -2 * (coords[1] - canvas.height / 2) / scale];
}

function getEventCoords(event) {
  if (event.clientX && event.clientY) {
    return [event.clientX, event.clientY];
  } else if (event.touches && event.touches[0]) {
    var touch = event.touches[0];
    return [touch.clientX, touch.clientY];
  }
}

var mousedownPlanetData, mouseCoords;

function mousedownHandler (event) {
  var coords = scaleCoords(getEventCoords(event));
  var planetData = findPlanetNear(coords, 0) || findPlanetNear(coords, 0.1);
  if (!planetData) {
    planetData = {};
    planetData.planet = {
      coords: coords,
      mass: 1,
      velocity: [0, 0],
      radius: 0.025
    };
    planets.push(planetData.planet);
    planetData.offset = [0, 0];
  }
  mousedownPlanetData = planetData;
}

function mousemoveHandler (event) {
  mouseCoords = getEventCoords(event);
}

function mouseupHandler (event) {
  mouseCoords = undefined;
  mousedownPlanetData = undefined;
}

canvas.addEventListener('mousedown', mousedownHandler);
canvas.addEventListener('touchstart', mousedownHandler);

canvas.addEventListener('mousemove', mousemoveHandler);

canvas.addEventListener('mouseup', mouseupHandler);
canvas.addEventListener('touchend', mouseupHandler);

var paused = false;

document.addEventListener('keyup', function (event) {
  if (String.fromCharCode(event.keyCode) === ' ') paused = !paused;
});

function updatePositions() {
  for (var i = 0; i < planets.length; i++) {
    var planet = planets[i];
    if (mousedownPlanetData && mousedownPlanetData.planet === planet) continue;
    planet.acceleration = [0, 0]; // we have no jerk, so we can recalculate it each time
    var sunAcceleration = gravityConstant * sunMass / (Math.pow(planet.coords[0], 2) + Math.pow(planet.coords[1], 2));
    var acceleration = [0, 0];
    acceleration[0] -= sunAcceleration*Math.cos(Math.atan2(planet.coords[1], planet.coords[0]));
    acceleration[1] -= sunAcceleration*Math.sin(Math.atan2(planet.coords[1], planet.coords[0]));
    for (var x = 0; x < oldPlanets.length; x++) {
      if (i === x) continue;
      var oldPlanet = oldPlanets[x];
    }
    planet.velocity[0] += acceleration[0];
    planet.velocity[1] += acceleration[1];
    planet.coords[0] += planet.velocity[0];
    planet.coords[1] += planet.velocity[1];
    if (Math.hypot.apply(Math, planet.coords) < sunRadius) {
      planets.splice(i, 1);
      i--;
    }
  }
}

function updateDrag() {
  if (!mousedownPlanetData || !mouseCoords) return;
  var planet = mousedownPlanetData.planet;
  var offset = mousedownPlanetData.offset;
  var newCoords = scaleCoords(mouseCoords);
  newCoords[0] -= offset[0];
  newCoords[1] -= offset[1];
  planet.velocity = [planet.velocity[0] / 2 + (newCoords[0] - planet.coords[0]) / 2, planet.velocity[1] / 2 + (newCoords[1] - planet.coords[1]) / 2];
  planet.coords = newCoords;
}

function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (oldPlanets) {
    drawPlanets(oldPlanets, 'black'); // erase the old planets
  }
  oldPlanets = planets.map(planet => JSON.parse(JSON.stringify(planet))); // duplicate the planets
  if (!paused) updatePositions();
  updateDrag();
  drawPlanets(planets, 'lightgreen');

  // Sun
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, sunRadius * scale, 0, 2*Math.PI);
  ctx.fill();

  window.requestAnimationFrame(draw);
}
window.requestAnimationFrame(draw);
