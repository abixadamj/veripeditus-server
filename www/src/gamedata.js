/*
 * veripeditus-web - Web frontend to the veripeditus server
 * Copyright (C) 2016, 2017  Dominik George <nik@naturalnet.de>
 * Copyright (C) 2016  Eike Tim Jesinghaus <eike@naturalnet.de>
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

GameObject = function(id) {
    this.id = id;
    this.latitude = 0.0;
    this.longitude = 0.0;
};

GameDataService = function() {
    var self = this;
    self.name = "gamedata";

    log_debug("Loading GameDataService.");

    // Status objects
    self.bounds = [
        [0.0, 0.0],
        [0.0, 0.0]];

    // Storage objects
    self.gameobjects = {};
    self.gameobjects_temp = {};
    self.gameobjects_missing = 0;
    self.gameobject_types = ["Player", "Item", "NPC"];
    self.worlds = {};

    // Current player id
    self.current_player_id = -1;

    self.doRawRequest = function (method, url, cb, dataType, data) {
        log_debug("Assembling HTTP request:");

        // Fill options here
        var options = {};
        options.method = method;
        options.url = url;
        log_debug(method + " " + url);
        if (cb) {
            if (dataType !== null) {
                options.dataType = dataType;
            }
            options.success = cb;
        }
        if (data) {
            options.dataType = "json";
            options.contentType = "application/vnd.api+json";
            options.data = data;
        }

        // Check whether a username was provided
        if (localStorage.username) {
            // Add username and password
            options.headers = {
                "Authorization": "Basic " + btoa(localStorage.username + ":" + localStorage.password)
            };
            options.username = localStorage.username;
            options.password = localStorage.password;

            log_debug("Authenticating as " + options.username + ".");

            // Do the request
            log_debug("Setting of request.");
            return $.ajax(options);
        } else {
            // Skip request
            log_debug("Skipping request.");
            return false;
        }
    };

    self.doRequest = function (method, url, cb, data) {
        var dataType = cb ? 'json' : null;
        return self.doRawRequest(method, url, cb, dataType, data);
    };

    self.last_location_update = Date.now();
    self.onGeolocationChanged = function() {
        log_debug("GameDataService received geolocation update.");

        // Update own location on server if logged in
        if (self.current_player_id > -1) {
            // Update location in player object
            self.gameobjects[self.current_player_id].attributes.latitude = Device.position.coords.latitude;
            self.gameobjects[self.current_player_id].attributes.longitude = Device.position.coords.longitude;

            log_debug("Updated own gameobject with new geolocation.");

            // Check time of last update
            if (Date.now() - self.last_location_update > 5000) {
                // Send the update request
                log_debug("Sending geolocation update to the server.");
                self.doRequest("GET", "/api/v2/gameobject/" + self.current_player_id + "/update_position/" + self.gameobjects[self.current_player_id].attributes.latitude + "," + self.gameobjects[self.current_player_id].attributes.longitude);
                self.last_location_update = Date.now();
            } else {
                log_debug("Skipping sending geolocation updat eto server.");
            }
        }
    };

    self.onReturnGameObjects = function(data) {
        log_debug("Received gameobjects from server.");

        // Iterate over data and merge into gameobjects store
        for (var i = 0; i < data.data.length; i++) {
            var go = data.data[i];
            self.gameobjects_temp[go.id] = go;
            log_debug("Stored gameobject id " + go.id + ".");
        }
        for (var i = 0; i < data.included.length; i++) {
            var go = data.included[i];

            // Verify that this is indeed a game objectm not a world
            if (go.type.startsWith("game")) {
                self.gameobjects_temp[go.id] = go;
                log_debug("Stored gameobject id " + go.id + ".");
            }
        }

        // Reduce missing objects counter
        self.gameobjects_missing -= 1;

        if (self.gameobjects_missing == 0) {
            log_debug("Finished receiving gameobjects.");

            // Move gameobjects to working copy
            self.gameobjects = self.gameobjects_temp;
            self.gameobjects_temp = {};

            // Call onUpdatedGameObjects on all services
            $.each(Veripeditus.services, function(id, service) {
                if (service.onUpdatedGameObjects) {
                    service.onUpdatedGameObjects();
                }
            });
        }
    };

    self.updateGameObjects = function() {
        // Skip if gameobjects are still missing from previous load
        if (self.gameobjects_missing > 0) {
            log_debug("Still processing previous request to update gameobjects.");
            return;
        }

        // Only run if logged-in
        if (self.current_player_id > -1) {
            log_debug("Loading gameobjects.");

            // Construct JSON query filter for REST API
            var query = [{
                'or': [{
                    'and': [{
                        'name': 'latitude',
                        'op': 'ge',
                        'val': self.bounds[0][0]
                    },
                    {
                        'name': 'latitude',
                        'op': 'le',
                        'val': self.bounds[1][0]
                    },
                    {
                        'name': 'longitude',
                        'op': 'ge',
                        'val': self.bounds[0][1]
                    },
                    {
                        'name': 'longitude',
                        'op': 'le',
                        'val': self.bounds[1][1]
                    },
                    {
                        'name': 'world',
                        'op': 'has',
                        'val': {
                            'name': 'id',
                            'op': 'eq',
                            'val': self.gameobjects[self.current_player_id].relationships.world.data.id
                        }
                    },
                    {
                        'name': 'isonmap',
                        'op': 'eq',
                        'val': true
                    }]
                },
                {
                    'name': 'id',
                    'op': 'eq',
                    'val': self.current_player_id
                }]
            }];

            // Define and trace gameobject types to load
            self.gameobjects_missing = self.gameobject_types.length;

            // Clear out gameobjects
            self.gameobjects_temp = {};

            $.each(self.gameobject_types, function(i, gameobject_type) {
                self.doRequest("GET", "/api/" + gameobject_type, self.onReturnGameObjects, {
                    'filter[objects]': JSON.stringify(query)
                });
            });
        } else {
            // Invalidate game
            log_debug("Not logged in, invalidating game.");
            self.gameobjects = {};

            // Call onUpdatedGameObjects on all services
            $.each(Veripeditus.services, function(id, service) {
                if (service.onUpdatedGameObjects) {
                    service.onUpdatedGameObjects();
                }
            });
        }
    };

    self.updateSelf = function() {
        log_debug("Updating own player item.");

        // Request own player item
        self.doRequest("GET", "/api/v2/gameobject_player/self", function(data) {
            self.current_player_id = data.data.id;
            self.gameobjects[data.data.id] = data.data;
            self.updateGameObjects();
        });

        // Request list of worlds
        log_debug("Loading worlds.");
        self.doRequest("GET", "/api/world", function(data) {
            self.worlds = data.data;
        });
    };

    self.joinWorld = function(id) {
        log_debug("Joining world id " + id + ".");

        // Set off request
        self.doRequest("GET", "/api/v2/world/" + id + "/player_join", function() {
            // Chain self update
            self.updateSelf();
        });
    };

    // Public method to update view boundaries, e.g. from map view
    self.setBounds = function(southWest, northEast) {
        self.bounds[0] = southWest;
        self.bounds[1] = northEast;

        self.updateGameObjects();
    };

    self.login = function(username, password) {
        localStorage.setItem("username", username);
        localStorage.setItem("password", password);

        log_debug("Logging in as " + username + ".");

        // Update own player state
        self.updateSelf();
    };

    self.register = function(username, password) {
        localStorage.setItem("username", username);
        localStorage.setItem("password", password);

        log_debug("Registering new user " + username + ".");

        // Call register API
        self.doRequest("GET", "/api/v2/user/register", function() {
            // Do a normal login once registered
            self.login(username, password);
        });
    };

    self.logout = function() {
        localStorage.removeItem("username");
        localStorage.removeItem("password");

        log_debug("Logging out.");

        // This wil invalidate the game
        self.current_player_id = -1;
        self.updateGameObjects();
    };

    self.item_collect = function(id, view) {
        self.doRequest("GET", "/api/v2/gameobject/" + id + "/collect", function(data) {
            view.onGameObjectActionDone(data);
            self.updateGameObjects();
        });
    };

    self.npc_talk = function(id, view) {
        self.doRequest("GET", "/api/v2/gameobject/" + id + "/talk", function(data) {
            view.onGameObjectActionDone(data);
            self.updateGameObjects();
        });
    };
};

GameData = new GameDataService();

// Do re-login for self-update
if (localStorage.username) {
    GameData.updateSelf();
}

// Bind global error handler
$(document).bind("ajaxError", function(req, status, error) {
    if ((status.readyState == 4) && (status.status == 401)) {
        // Login failed or not logged in for some reason
        // Invalidate
        GameData.logout();

        // Show message
        var dialog = $('div#dialog');
        dialog.empty();
        dialog.attr("title", "Login Error");
        var html = "<p>Your login failed. Please try again!</p>";
        var elem = $(html);
        dialog.append(elem);
        dialog.dialog();
    }
});

Veripeditus.registerService(GameData);
