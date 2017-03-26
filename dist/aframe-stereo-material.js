/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	// Browser distrubution of the A-Frame component.
	(function () {
	  if (!AFRAME) {
	    console.error('Component attempted to register before AFRAME was available.');
	    return;
	  }

	  // Register all components here.
	  var components = {
	    stereo: __webpack_require__(1).stereo_component,
	    stereocam: __webpack_require__(1).stereocam_component
	  };

	  Object.keys(components).forEach(function (name) {
	    if (AFRAME.aframeCore) {
	      AFRAME.aframeCore.registerComponent(name, components[name]);
	    } else {
	      AFRAME.registerComponent(name, components[name]);
	    }
	  });
	})();



/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = {

		'stereo_material': {

			/* defaults */
			schema: {
				eye: {
					type: 'string',
					default: 'left'
				},
				split: {
					type: 'string',
					default: 'horizontal'
				},
				orientation: {
					type: 'string',
					default: 'landscape'
				}
			},


			/* init */
			init: function() {

				/* get object3d */
				this.object3D = this.el.object3D.children[0];

				/* video vars */
				this.isVideo = false;
				this.videoClickHandlerAdded = false;

				/* check source for video */
				this.checkIfVideo();

				var geometry = this.getGeometry();
				if (geometry) {
					this.generateStereoTextures(geometry);
				}
			},


			/* check if video object */
			checkIfVideo: function(src) {
				if (this.el.getAttribute('material') !== null && 'src' in this.el.getAttribute('material') && this.el.getAttribute('material').src !== '') {
					var src = this.el.getAttribute('material').src;
					if(typeof(src) == 'object' && Object.prototype.toString.call(src) == '[object HTMLVideoElement]') {
						this.isVideo = true;
					}
				}
			},


			/* get cloned geometry from object3d */
			getGeometry: function() {
				var geoclone = new THREE.Geometry();
				return geoclone.fromBufferGeometry(this.object3D.geometry);
			},


			/* generate stereo textures */
			generateStereoTextures: function(geometry) {
				/* If left eye is set, and the split is horizontal, take the left half of the video texture. If the split
				   is set to vertical, take the top/upper half of the video texture. */
				if (this.data.eye === 'left') {
					var uvs = geometry.faceVertexUvs[0];
					var axis = this.data.split === 'vertical' ? 'y' : 'x';
					for (var i = 0; i < uvs.length; i++) {
						for (var j = 0; j < 3; j++) {
							if (axis == 'x') {
								uvs[i][j][axis] *= 0.5;
							} else {
								uvs[i][j][axis] *= 0.5;
								uvs[i][j][axis] += 0.5;
							}
						}
					}
				}

				/* If right eye is set, and the split is horizontal, take the right half of the video texture. If the split
				   is set to vertical, take the bottom/lower half of the video texture. */
				if (this.data.eye === 'right') {
					var uvs = geometry.faceVertexUvs[0];
					var axis = this.data.split === 'vertical' ? 'y' : 'x';
					for (var i = 0; i < uvs.length; i++) {
						for (var j = 0; j < 3; j++) {
							if (axis == 'x') {
								uvs[i][j][axis] *= 0.5;
								uvs[i][j][axis] += 0.5;
							} else {
								uvs[i][j][axis] *= 0.5;
							}
						}
					}
				}

				this.object3D.geometry = new THREE.BufferGeometry().fromGeometry(geometry);
			},


			/* on element update, put in the right layer, 0:both, 1:left, 2:right */
			update: function() {
				if (this.data.eye === 'both') {
					this.object3D.layers.set(0);
				} else {
					this.object3D.layers.set(this.data.eye === 'left' ? 1 : 2);
				}
			},


			/* attach click handler if video */
			tick: function(time) {
				if (this.isVideo && !this.videoClickHandlerAdded) {
					if (typeof(this.el.sceneEl.canvas) !== 'undefined') {
						var self = this;
						self.videoEl = this.object3D.material.map.image;

						this.el.sceneEl.canvas.onclick = function() {
							self.videoEl.play();
						};
						this.videoClickHandlerAdded = true;
					}
				}
			}
		},


		'stereo_cam': {

			/* defaults */
			schema: {
				eye: {
					type: 'string',
					default: 'left'
				}
			},

			/* cam is not attached on init, so use a flag to do this once at 'tick'
			   use update every tick if flagged as 'not changed yet' */
			init: function() {
				this.layer_changed = false;
			},

			tick: function(time) {

				var originalData = this.data;

				if (!this.layer_changed) {

					/* gather the children of this a-camera and identify types */
					var childrenTypes = [];

					this.el.object3D.children.forEach(function(item, index, array) {
						childrenTypes[index] = item.type;
					});

					/* retrieve the PerspectiveCamera */
					var rootIndex = childrenTypes.indexOf('PerspectiveCamera');
					var rootCam = this.el.object3D.children[rootIndex];

					if (originalData.eye === 'both') {
						rootCam.layers.enable(1);
						rootCam.layers.enable(2);
					} else {
						rootCam.layers.enable(originalData.eye === 'left' ? 1 : 2);
					}
				}
			}

		}
	};;


/***/ }
/******/ ]);