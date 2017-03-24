var AFRAME = require('aframe');
var sunSky = require('aframe-sun-sky');
var stereoMaterial = require('../index.js').stereo_material;
var stereoCam = require('../index.js').stereo_cam;

AFRAME.registerComponent('sunsky', sunSky);
AFRAME.registerComponent('stereo-material', stereoMaterial);
AFRAME.registerComponent('stereo-cam', stereoCam);

require('aframe');
