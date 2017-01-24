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

    // Create a markerClusterGroup for marker clustering functionality
    self.marker_cluster_group = L.markerClusterGroup({
        zoomToBoundsOnClick: false,
        showCoverageOnHover: false,
        animate: true
    });

    // Add markerClusterGroup to map as a layer
    self.map.addLayer(self.marker_cluster_group);

    // Called by GameDataService on gameobjects update
    self.onUpdatedGameObjects = function () {
        if (!self.active) return;

        log_debug("MapController received update of gameobjects.");

        // Iterate over gameobjects and add map markers
        $.each(GameData.gameobjects, function (id, gameobject) {
            log_debug("Inspecting gameobject id " + id + ".");

            // Check whether item should be shown on the map
            if (!gameobject.attributes.isonmap) {
                log_debug("Not on map.");
                return;
            }

            // Look for already created marker for self gameobject id
            var markerw = self.gameobject_markers[gameobject.id];
            if (markerw) {
                // Marker exists, store location
                markerw[1].setLatLng([gameobject.attributes.latitude, gameobject.attributes.longitude]);
                if (gameobject.attributes.image != markerw[0]) {
                    // Update icon as well
                    var icon = L.icon({
                        'iconUrl': '/api/v2/gameobject/' + gameobject.id + '/image_raw/' + gameobject.attributes.image,
                        'iconSize': [32, 32],
                    });
                    markerw[1].setIcon(icon);
                    markerw[0] = ('' + gameobject.attributes.image);
                }
                log_debug("Updated marker.");
            } else {
                // Marker does not exist
                // Construct marker icon from gameobject image
                var icon = L.icon({
                    'iconUrl': '/api/v2/gameobject/' + gameobject.id + '/image_raw/' + gameobject.attributes.image,
                    'iconSize': [32, 32],
                });

                // Create marker at gameobject location
                marker = L.marker([gameobject.attributes.latitude, gameobject.attributes.longitude], {
                    'icon': icon
                });

                // Create popup
                marker.on('click', function (e) {
                    UI.render_view('popup', {
                        'gameobject': gameobject,
                        'leaflet-event': e,
                    });
                });

                // Add marker to map and store to known markers
                marker.addTo(self.marker_cluster_group);
                self.gameobject_markers[gameobject.id] = [('' + gameobject.attributes.image), marker, ];
                log_debug("Created marker.");
            }
        });

        // Iterate over found markers and remove everything not found in gameobjects
        $.each(self.gameobject_markers, function (id, marker) {
            log_debug("Inspecting marker for gameobject id " + id + ".");

            if ($.inArray(id, Object.keys(GameData.gameobjects)) == -1) {
                // Remove marker if object vanished from gameobjects
                self.marker_cluster_group.removeLayer(marker);
                delete self.gameobject_markers[id];
                log_debug("No longer exists, removing.");
            } else if (!GameData.gameobjects[id].attributes.isonmap) {
                // Remove marker if object is not visible on map anymore
                self.marker_cluster_group.removeLayer(marker);
                delete self.gameobject_markers[id];
                log_debug("No longer on map, removing.");
            }
        });
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
