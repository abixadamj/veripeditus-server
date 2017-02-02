/*
 * veripeditus-web - Web frontend to the veripeditus server
 * Copyright (C) 2016, 2017  Dominik George <nik@naturalnet.de>
 * Copyright (C) 2017  Eike Tim Jesinghaus <eike@naturalnet.de>
 * Copyright (c) 2017  mirabilos <thorsten.glaser@teckids.org>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

CamController = function () {
    var self = this;
    self.name = "cam";
    self.active = false;

    log_debug("Loading CamController.");

    self.MAX_DISTANCE = 100;

    // Find video view and AR view
    self.cam = $("#cam");
    self.arview = $("#arview");

    // Set perspective
    self.perspective = window.innerWidth / 2;
    self.arview.css("perspective", self.perspective);

    // Called by DeviceService on camera stream change
    self.onCameraChanged = function () {
        if (!self.active) return;

        log_debug("Camera stream changed. New URL: " + Device.cameraUrl);

        // Update stream URL of video view
        self.cam.attr("src", Device.cameraUrl);
        self.cam.on("loadedmetadata", function () {
            self.cam.play();
        });
    };

    self.getARStyles = function (gameobject) {
        log_debug("Assembling AR styles for gameobject id " + gameobject.id + ".");

        // Target object
        var style = {};
        // Parent of target object
        var image_div = {};

        // Center image first
        if (! (gameobject.id in self.gameobject_widths)) {
            self.gameobject_widths[gameobject.id] = $("#argameobject-" + gameobject.id).width();
        }
        image_div['left'] = ((window.innerWidth - self.gameobject_widths[gameobject.id]) / 2) + "px";
        if (! (gameobject.id in self.gameobject_heights)) {
            self.gameobject_heights[gameobject.id] = $("#argameobject-" + gameobject.id).height();
        }
        image_div['top'] = ((window.innerHeight - self.gameobject_heights[gameobject.id]) / 2) + "px";

        // Get own LatLng
        var own_latlng = L.latLng(Device.position.coords.latitude, Device.position.coords.longitude);
        // Get gameobject LatLng
        var gameobject_latlng = L.latLng(gameobject.attributes.latitude, gameobject.attributes.longitude);

        // Get distance and bearing
        var distance = own_latlng.distanceTo(gameobject_latlng);
        var bearing = L.GeometryUtil.bearing(own_latlng, gameobject_latlng);
        // Determine difference of bearing and device orientation
        var bearing_diff = bearing - Device.orientation.heading;
        while (bearing_diff > 180) {
            bearing_diff -= 360;
        }
        while (bearing_diff < -180) {
            bearing_diff += 360;
        }
        if ((bearing_diff > -90) && (bearing_diff < 90) && (distance <= self.MAX_DISTANCE)) {
            // Calculate offsets in 3D space in relation to camera
            var angle = bearing_diff * L.LatLng.DEG_TO_RAD;
            var tx = Math.sin(angle) * self.perspective;
            var ty = 0;
            var tz = Math.cos(angle) * self.perspective * (distance / self.MAX_DISTANCE);

            // Generate transform functions
            var rotation = "rotateY(" + (-bearing_diff) + "deg)";
            var offset = "translate3d(" + tx + "px, " + ty + "px, " + -tz + "px)";

            log_debug("Gameobject is " + distance + "m in " + bearing + "°, diff " + bearing_diff + "°. " + rotation + "," + offset);
            // Generate CSS transform attributes
            image_div['transform'] = offset;
            style['transform'] = rotation;
            // Sort z-index of objects by distance
            image_div['z-index'] = Math.round((self.MAX_DISTANCE - distance) * 100 + 1);
            // Unhide object
            image_div['display'] = '';
        } else {
            log_debug("Gameobject is " + distance + "m in " + bearing + "°, diff " + bearing_diff + "°.");
            // Object is behind us and not visible
            image_div['display'] = 'none';
        }

        return {
            'container': image_div,
            'image': style
        };
    };

    // Already created images for gameobjects will be stored here.
    self.gameobject_images = {};
    self.gameobject_imagenames = {};
    self.gameobject_widths = {};
    self.gameobject_heights = {};

    // Flag to determine whether DOM/gameobject updating is in progress
    self.is_updating = false;

    // Called by GameDataService on gameobject update
    self.onUpdatedGameObjects = function () {
        if (!self.active) return;
        if (self.is_updating) return;

        log_debug("CamController received update of gameobjects.");

        self.is_updating = true;

        // Iterate over gameobjects and add images
        $.each(GameData.gameobjects, function (id, gameobject) {
            log_debug("Inspecting gameobject id " + id + ".");

            // Check whether item should be shown
            if (!gameobject.attributes.isonmap) {
                log_debug("Item is not on map.");
                return;
            }

            // Skip if object is own player. This is not covered by
            // HIDE_SELF in isonmap because even if it is True, we
            // don't want ourselves in a first person view.
            if (id == GameData.current_player_id) {
                return;
            }

            // Look for already created image for gameobject id
            var image = self.gameobject_images[gameobject.id];
            if (!image) {
                // Image does not exist
                // Construct image element
                image = $("<img>", {
                    id: "argameobject-" + gameobject.id,
                    "class": "argameobject",
                    src: '/api/v2/gameobject/' + gameobject.id + '/image_raw/' + gameobject.attributes.image,
                });

                // Add image to DOM
                var image_div = $('<div>', {
                    'class': 'argameobjectwrapper',
                });
                image_div.append(image);
                self.arview.append(image_div);
                self.gameobject_images[gameobject.id] = image;
                self.gameobject_imagenames[gameobject.id] = ('' + gameobject.attributes.image);

                // Attach click action
                $(document).on("click", "#argameobject-" + gameobject.id, function () {
                    UI.render_view('popup', {
                        'gameobject': gameobject,
                    });
                });

                log_debug("Created image.");
            } else {
                if (self.gameobject_imagenames[gameobject.id] != gameobject.attributes.image) {
                    $('#argameobject-' + gameobject.id).attr('src', '/api/v2/gameobject/' + gameobject.id + '/image_raw/' + gameobject.attributes.image);
                    self.gameobject_imagenames[gameobject.id] = ('' + gameobject.attributes.image);
                }
                log_debug("Found existing image.");
            }

            // Update image style on size change, and once right now
            image.resize(function () {
                self.updateOneARStyle(image, gameobject);
            });
            self.updateOneARStyle(image, gameobject);
        });

        // Iterate over found images and remove everything not found in gameobjects
        $.each(self.gameobject_images, function (id, image) {
            log_debug("Inspecting gameobject id " + id + ".");

            if ($.inArray(id, Object.keys(GameData.gameobjects)) == -1) {
                // Remove image if object vanished from gameobjects
                image.parent().remove();
                delete self.gameobject_images[id];
                delete self.gameobject_widths[id];
                delete self.gameobject_heights[id];
                log_debug("No longer exists, removing.");
            } else if (!GameData.gameobjects[id].attributes.isonmap) {
                // Remove image if object is not visible on map anymore
                image.parent().remove();
                delete self.gameobject_images[id];
                delete self.gameobject_widths[id];
                delete self.gameobject_heights[id];
                log_debug("No longer on map, removing.");
            }
        });

        self.is_updating = false;
    };

    // Called by DeviceService on geolocation change
    self.onGeolocationChanged = function () {
        if (!self.active) return;

        log_debug("CamController received geolocation change.");

        // Calculate view bounds
        // FIXME come up with something smarter
        var bounds = [
            [Device.position.coords.latitude - 0.001, Device.position.coords.longitude - 0.001],
            [Device.position.coords.latitude + 0.001, Device.position.coords.longitude + 0.001]];

        // Update bounds in GameDataService
        GameData.setBounds(bounds[0], bounds[1]);
    };

    self.updateOneARStyle = function (image, gameobject) {
        var styles = self.getARStyles(gameobject);

        image.parent().css(styles['container']);
        image.css(styles['image']);
    };

    // Recalculate all images
    self.updateAllARStyles = function () {
        if (self.is_updating) return;

        self.is_updating = true;

        $.each(self.gameobject_images, function (id, image) {
            self.updateOneARStyle(image, GameData.gameobjects[id]);
        });

        self.is_updating = false;
    };

    // Called by DeviceService on orientation change
    self.onOrientationChanged = function () {
        if (!self.active) return;

        log_debug("CamController received orientation change.");

        // Update AR style for all objects
        self.updateAllARStyles();
    };

    self.handleDebugKeys = function (event) {
        var FORWARD = "w".charCodeAt(0);
        var BACKWARD = "s".charCodeAt(0);
        var LEFT = "a".charCodeAt(0);
        var RIGHT = "d".charCodeAt(0);

        if (event.which == LEFT) {
            fake_orientation = {
                alpha: 0,
                beta: 0,
                gamma: 0,
                absolute: false,
                heading: (Device.orientation.heading + (Device.orientation.heading < 5 ? 360 : 0)) - 5
            };
            Device.handleOrientation(fake_orientation);
        } else if (event.which == RIGHT) {
            fake_orientation = {
                alpha: 0,
                beta: 0,
                gamma: 0,
                absolute: false,
                heading: (Device.orientation.heading + 5) % 360
            };
            Device.handleOrientation(fake_orientation);
        } else if (event.which == FORWARD) {
            var own_latlng = L.latLng(Device.position.coords.latitude, Device.position.coords.longitude);
            var new_latlng = L.GeometryUtil.destination(own_latlng, Device.orientation.heading, 5);

            fake_pos = {
                "timestamp": Date.now(),
                "coords": {
                    "latitude": new_latlng.lat,
                    "longitude": new_latlng.lng,
                    "accuracy": 1
                }
            };
            Device.onLocationUpdate(fake_pos);
        } else if (event.which == BACKWARD) {
            var own_latlng = L.latLng(Device.position.coords.latitude, Device.position.coords.longitude);
            var new_latlng = L.GeometryUtil.destination(own_latlng, (Device.orientation.heading + 180) % 360, 5);

            fake_pos = {
                "timestamp": Date.now(),
                "coords": {
                    "latitude": new_latlng.lat,
                    "longitude": new_latlng.lng,
                    "accuracy": 1
                }
            };
            Device.onLocationUpdate(fake_pos);
        }
    };

    // Pass item_collect to GameData with self reference
    self.item_collect = function (id) {
        GameData.item_collect(id, self);
    };

    // Pass npc_talk to GameData with self reference
    self.npc_talk = function (id) {
        GameData.npc_talk(id, self);
    };

    // Called by GameData routines to close the popup something was called from.
    self.onGameObjectActionDone = function (data) {
        var dialog = $('div#dialog');
        dialog.dialog("close");

        // Show any message as a dialog
        // FIXME come up with something prettyer
        if (data.message) {
            dialog.empty();
            var html = "<p>" + data.message + "</p>";
            var elem = $(html);
            dialog.append(elem);
            dialog.dialog({
                title: GameData.gameobjects[data.gameobject].attributes.name
            });
        }
    };

    self.activate = function () {
        $("div#camview").show();
        Device.startCamera();
        log_debug("CamController activated.");
        self.active = true;
        self.onUpdatedGameObjects();
        if (Veripeditus.debug) {
            $(document).keypress(self.handleDebugKeys);
        }
    };

    self.deactivate = function () {
        $("div#camview").hide();
        self.active = false;
        Device.stopCamera();
        log_debug("CamController deactivated.");

        if (Veripeditus.debug) {
            $(document).unbind("keypress", self.handleDebugKeys);
        }
    };
};

// Instantiate controller and register to services
CamView = new CamController();
Veripeditus.registerView(CamView);
