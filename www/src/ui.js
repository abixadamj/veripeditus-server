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

function control_click() {
    var view = $(this).attr("id").substr(8);
    var dialog = $('<div id="dialog-' + view + '"></div>').load("html/views/" + view + ".html");
    var head = $('div#dialog-' + view + ' h1');
    var title = head.text();
    dialog.attr("title", title);
    head.remove();
    dialog.dialog();

    // UI magic
    if (view == "player") {
        if (localStorage.getItem("username")) {
            $("#dialog-player-login").hide();
            $("#dialog-player-logout").show();

            // Generate inventory list
            $('table#inventory-table').empty();
            for (i in GameData.gameobjects[GameData.current_player_id].inventory) {
                var item = GameData.gameobjects[GameData.current_player_id].inventory[i];
                var html = "<tr>";
                html += "<td><img src='/api/gameobject/" + item.id + "/image_raw' /></td>";
                html += "<td>" + item.name + "</td>";
                html += "</tr>";
                var elem = $(html);
                $('table#inventory-table').append(elem);
            }
        } else {
            $("#dialog-player-login").show();
            $("#dialog-player-logout").hide();
        }
    }
}

$('div.control').on("click", control_click);
