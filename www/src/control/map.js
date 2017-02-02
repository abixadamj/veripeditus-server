/*
 * veripeditus-web - Web frontend to the veripeditus server
 * Copyright (C) 2016, 2017  Dominik George <nik@naturalnet.de>
 * Copyright (C) 2016, 2017  Eike Tim Jesinghaus <eike@naturalnet.de>
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

MapController = function () {
    var self = this;
    self.name = "map";
    self.active = false;

    log_debug("Loading MapController.");

    // Set up map view
    self.map = L.map("map", {
        zoomControl: false,
        worldCopyJump: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(self.map);

    log_debug("Set up map layers.");

    // Add debugging handlers if debugging is enabled
    if (Veripeditus.debug) {
        self.map.on('click', function (event) {
            if (event.originalEvent.ctrlKey) {
                if (!event.originalEvent.shiftKey) {
                    log_debug("Faking geolocation.");

                    fake_pos = {
                        "timestamp": Date.now(),
                        "coords": {
                            "latitude": event.latlng.lat,
                            "longitude": event.latlng.lng,
                            "accuracy": 1
                        }
                    };
                    Device.onLocationUpdate(fake_pos);
                } else {
                    log_debug("Faking heading.");

                    // Get own LatLng
                    var own_latlng = L.latLng(Device.position.coords.latitude, Device.position.coords.longitude);

                    // Get bearing
                    var bearing = L.GeometryUtil.bearing(own_latlng, event.latlng);
                    fake_orientation = {
                        alpha: 0,
                        beta: 0,
                        gamma: 0,
                        absolute: false,
                        heading: bearing
                    };
                    Device.handleOrientation(fake_orientation);
                }
            }
        });
    }

    // Add initial marker for own position
    self.marker_self = L.marker([Device.position.coords.latitude, Device.position.coords.longitude]);
    //    self.marker_self.addTo(self.map);
    self.circle_self = L.circle(self.marker_self.getLatLng(), 0);
    self.circle_self.addTo(self.map);

    // Initially center map view to own position
    self.map.setView(self.marker_self.getLatLng(), 16);

    // Already created markers for gameobjects will be stored here.
    self.gameobject_markers = {};
    self.gameobject_icons = {};

    // Called by GameDataService on gameobjects update
    self.onUpdatedGameObjects = function () {
        if (!self.active) return;

        log_debug("MapController received update of gameobjects.");

        var new_markers = {};
        var new_icons = {};

        $.each(self.gameobject_markers, function (id, marker) {
            var gameobject = GameData.gameobjects[id];
            // assert: id === gameobject.id
            var url = false;

            if (gameobject && gameobject.attributes.isonmap) {
                url = '/api/v2/gameobject/' + gameobject.id + '/image_raw/' + gameobject.attributes.image;
            }

            if (url === self.gameobject_icons[id]) {
                new_markers[id] = marker;
                new_icons[id] = self.gameobject_icons[id];
            } else {
                self.map.removeLayer(marker);
            }
        });

        $.each(GameData.gameobjects, function (id, gameobject) {
            // assert: id === gameobject.id
            if (new_markers[id]) {
                new_markers[id].setLatLng([gameobject.attributes.latitude, gameobject.attributes.longitude]);
            } else if (gameobject.attributes.isonmap) {
                new_icons[id] = '/api/v2/gameobject/' + gameobject.id + '/image_raw/' + gameobject.attributes.image;

                var icon = L.icon({
                    'iconUrl': new_icons[id],
                    'iconSize': [32, 32],
                });

                var marker = L.marker([gameobject.attributes.latitude, gameobject.attributes.longitude], {
                    'icon': icon,
                });

                marker.on('click', function (e) {
                    UI.render_view('popup', {
                        'gameobject': gameobject,
                        'leaflet-event': e,
                    });
                });

                marker.addTo(self.map);
                new_markers[id] = marker;
            }
        });

        self.gameobject_markers = new_markers;
        self.gameobject_icons = new_icons;
    };

    // Called by DeviceService on geolocation update
    self.onGeolocationChanged = function () {
        if (!self.active) return;

        log_debug("MapController received geolocation update.");

        // Update position of own marker
        self.marker_self.setLatLng([Device.position.coords.latitude, Device.position.coords.longitude]);

        // Update accuracy radius around own marker
        self.circle_self.setLatLng(self.marker_self.getLatLng());
        self.circle_self.setRadius(Device.position.coords.accuracy);

        // Center map at own marker
        self.map.setView(self.marker_self.getLatLng());
    };

    // Subscribe to event on change of map view
    self.map.on('moveend', function (event) {
        // Update view bounds in GameDataService
        var bounds = event.target.getBounds();
        GameData.setBounds([bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]);
    });

    // Initially set bounds in GameDataService
    var bounds = self.map.getBounds();
    GameData.setBounds([bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]);

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
        self.map.closePopup();

        // Show any message as a dialog
        // FIXME come up with something prettyer
        if (data.message) {
            var dialog = $('div#dialog');
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
        log_debug("MapController activated.");
        self.active = true;
        $("div#map").show();
        self.onUpdatedGameObjects();
    };

    self.deactivate = function () {
        log_debug("MapController deactivated.");
        self.active = false;
        $("div#map").hide();
    };
};

// Instantiate controller and register to services
MapView = new MapController();
Veripeditus.registerView(MapView);
