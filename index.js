module.exports = {

	'stereo_material': {

		/* defaults */
		schema: {
			eye: {
				type: 'string',
				default: "left"
			},
			mode: {
				type: 'string',
				default: "full"
			},
			split: {
				type: 'string',
				default: "horizontal"
			}
		},

		init: function() {

			/* check if material is video and manage video click eventhandler*/
			this.video_click_event_added = false;
			this.material_is_a_video = false;
			if (this.el.getAttribute("material") !== null && 'src' in this.el.getAttribute("material") && this.el.getAttribute("material").src !== "") {
				var src = this.el.getAttribute("material").src;
				// If src is a string, treat it like a selector, for aframe <= v0.3
				if ((toString.call(src) == '[object String]' &&
						document.querySelector(src) !== null &&
						document.querySelector(src).tagName === "VIDEO") ||
					// If src is a video element , just get the tagName
					('tagName' in src &&
						src.tagName === "VIDEO")) {
					this.material_is_a_video = true;
				}
			}


			/* get object (first children is object, because all objects are grouped) */
			var object3D = this.el.object3D.children[0];

			/* valid geometry checks ... todo: implement your code here */
			var validGeometries = [THREE.SphereGeometry, THREE.CylinderGeometry, THREE.SphereBufferGeometry, THREE.BufferGeometry];
			var isValidGeometry = validGeometries.some(function(geometry) {
				return object3D.geometry instanceof geometry;
			});

			if (isValidGeometry && this.material_is_a_video) {

				console.log(this.data);

				if (this.data.mode === "half") {
					var geo_def = this.el.getAttribute("geometry");
					var geometry = new THREE.SphereGeometry(geo_def.radius || 100, geo_def.segmentsWidth || 64, geo_def.segmentsHeight || 64, Math.PI / 2, Math.PI, 0, Math.PI);
				} else if (this.data.mode === "cinema") {
					var geo_def = this.el.getAttribute("geometry");
					var geometry = new THREE.CylinderGeometry(geo_def.radius * 10, geo_def.radius * 10, geo_def.height * 10, 50, 1, true, geo_def.thetaStart, geo_def.thetaLength * Math.PI / 180);
				} else {
					var geo_def = this.el.getAttribute("geometry");
					var geometry = new THREE.SphereGeometry(geo_def.radius || 100, geo_def.segmentsWidth || 64, geo_def.segmentsHeight || 64);
				}


				/* If left eye is set, and the split is horizontal, take the left half of the video texture. If the split
				   is set to vertical, take the top/upper half of the video texture. */
				if (this.data.eye === "left") {
					console.log('left');
					var uvs = geometry.faceVertexUvs[0];
					var axis = this.data.split === "vertical" ? "y" : "x";
					for (var i = 0; i < uvs.length; i++) {
						for (var j = 0; j < 3; j++) {
							if (axis == "x") {
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
				if (this.data.eye === "right") {
					var uvs = geometry.faceVertexUvs[0];
					var axis = this.data.split === "vertical" ? "y" : "x";
					for (var i = 0; i < uvs.length; i++) {
						for (var j = 0; j < 3; j++) {
							if (axis == "x") {
								uvs[i][j][axis] *= 0.5;
								uvs[i][j][axis] += 0.5;
							} else {
								uvs[i][j][axis] *= 0.5;
							}
						}
					}
				}

				/* transform geometry into buffergeometry for coherence */
				object3D.geometry = new THREE.BufferGeometry().fromGeometry(geometry);

			} else {

				/* todo: reorginisation ... No need to attach video click if not a sphere and not a video, set this to true */
				this.video_click_event_added = true;
			}
		},


		/* on element update, put in the right layer, 0:both, 1:left, 2:right (spheres or not) */
		update: function(oldData) {
			var object3D = this.el.object3D.children[0];
			var data = this.data;

			if (data.eye === "both") {
				object3D.layers.set(0);
			} else {
				object3D.layers.set(data.eye === 'left' ? 1 : 2);
			}
		},


		tick: function(time) {

			/* If this value is false, it means that (a) this is a video on a sphere [see init method]
			  and (b) of course, tick is not added */
			if (!this.video_click_event_added) {
				if (typeof(this.el.sceneEl.canvas) !== 'undefined') {

					this.videoEl = this.el.object3D.children[0].material.map.image;
					var self = this;

					this.el.sceneEl.canvas.onclick = function() {
						self.videoEl.play();
					};

					this.video_click_event_added = true;

				}
			}

		}
	},


	'stereo_cam': {

		/* defaults */
		schema: {
			eye: {
				type: 'string',
				default: "left"
			}
		},

		/* cam is not attached on init, so use a flag to do this once at 'tick'
		   Use update every tick if flagged as 'not changed yet' */
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
				var rootIndex = childrenTypes.indexOf("PerspectiveCamera");
				var rootCam = this.el.object3D.children[rootIndex];

				if (originalData.eye === "both") {
					rootCam.layers.enable(1);
					rootCam.layers.enable(2);
				} else {
					rootCam.layers.enable(originalData.eye === 'left' ? 1 : 2);
				}
			}
		}

	}
};;
