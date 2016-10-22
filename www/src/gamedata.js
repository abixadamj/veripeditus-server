/*
 * veripeditus-web - Web frontend to the veripeditus server
 * Copyright (C) 2016  Dominik George <nik@naturalnet.de>
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

Player = function(id) {
        this.id = id;
        this.latitude = 0.0;
        this.longitude = 0.0;
};

GameDataService = function() {
    // Status objects
    this.bounds = [
        [0.0, 0.0],
        [0.0, 0.0]];

    // Storage objects
    this.players = {};

    // FIXME Subscribe to signal
    this.onGeolocationChanged = function(event, position) {
        // Update own location on server if logged in
        if (API.loggedin()) {
            // FIXME do update player location
        }
    };

    this.onReturnPlayers = function(data) {
        // Iterate over data and merge into players store
        for (var i = 0; i < data.objects.length; i++) {
            // FIXME Skip own player because it is handled separately

            var player = new Player(data.objects[i].id);
            player.latitude = data.objects[i].latitude;
            player.longitude = data.objects[i].longitude;
            player.avatar = data.objects[i].avatar;
            player.username = data.objects[i].username;
            player.name = data.objects[i].username;
            this.players[player.id] = player;
        }

        // Call onUpdatedPlayers on all views
        for (view of Veripeditus.views) {
            view.onUpdatedPlayers();
        }
    };

    this.updatePlayers = function() {
        // Construct JSON query filter for REST API
        var query = {
            'filters': [{
                'and': [{
                    'name': 'latitude',
                    'op': 'ge',
                    'val': this.bounds[0][0]
                },
                {
                    'name': 'latitude',
                    'op': 'le',
                    'val': this.bounds[1][0]
                },
                {
                    'name': 'longitude',
                    'op': 'ge',
                    'val': this.bounds[0][1]
                },
                {
                    'name': 'longitude',
                    'op': 'le',
                    'val': this.bounds[1][1]
                }]
            }]
        };

        $.ajax({
            dataType: "json",
            contentType: "applicaiton/json",
            url: "/api/player",
            data: {
                q: JSON.stringify(query),
            },
            players: this.players,
            success: this.onReturnPlayers
        });
    };

    // Public method to update view boundaries, e.g. from map view
    this.setBounds = function(southWest, northEast) {
        this.bounds[0] = southWest;
        this.bounds[1] = northEast;

        this.updatePlayers();
    };
};

GameData = new GameDataService();
