/*
 * veripeditus-web - Web frontend to the veripeditus server
 * Copyright (C) 2016, 2017  Dominik George <nik@naturalnet.de>
 * Copyright (C) 2016  Eike Tim Jesinghaus <eike@naturalnet.de>
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

UIService = function () {
    var self = this;
    self.name = "ui";

    var dialog = $('div#dialog');

    var profile_tabs = {
        'inventory': 0,
        'profile': 1,
        'world': 2,
        'about': 3,
    };

    var avatars_handler = function (data) {
        var av = $('#dialog-avatars');
        var imgpfx = '/api/v2/gameobject/' + GameData.current_player_id + '/image_raw/';
        var imgheight = window.innerHeight * 3 / 10;
        var curr = GameData.gameobjects[GameData.current_player_id].attributes.image;

        data.sort();
        $.each(data, function (number, id) {
            var imgcls = (id == curr) ? 'avatar-current' : 'avatar-available';
            var img = $('<img>', {
                'class': imgcls,
                'src': imgpfx + id,
                'alt': id,
                'height': imgheight,
            });

            img.click(function () {
                av.text('Loading…');
                GameData.doRequestSimple('/api/v2/gameobject/' + GameData.current_player_id + '/set_image/' + id, function () {
                    GameData.updateSelf(function () {
                        dialog.dialog("close");
                        self.render_view('player', {
                            'active_tab': profile_tabs['profile'],
                            'width':
                            /* restore default */
                            300,
                        });
                    });
                });
            });
            av.append(img);
        });
    };

    self.render_view = function (view, opts) {
        opts = opts || {};
        dialog.load("html/views/" + view + ".html", function () {
            var head = $('div#dialog h1');
            opts.title = head.text();
            head.remove();

            // Code to run before the dialogue is rendered (and sized)
            if (view == 'avatars') {
                $('#dialog-avatars').height(window.innerHeight * 1 / 3);
            } else if (view == 'popup') {
                opts.title = opts.gameobject.attributes.name;
            } else if (view == 'message') {
                opts.title = opts.source;
            }

            //XXX (FIXME: temporarily) Force all dialogues to 90% screen size
            // (except those created from other places in the JS code)
            opts.width = window.innerWidth * 9 / 10;
            opts.height = window.innerHeight * 9 / 10;
            //XXX FIXME: replace
            dialog.dialog(opts);

            // UI magic
            if (view == "player") {
                var active_tab = opts.active_tab || 0;

                $('#dialog-player-login-tabs').tabs();
                $('#dialog-player-logout-tabs').tabs({
                    'active': active_tab,
                });

                $('button#dialog-player-login-button').click(function () {
                    var username = $('#dialog-player-login-username').val();
                    var password = $('#dialog-player-login-password').val();
                    dialog.dialog("close");
                    GameData.login(username, password);
                });

                $('button#dialog-player-register-button').click(function () {
                    var username = $('#dialog-player-register-newusername').val();
                    var password = $('#dialog-player-register-newpassword').val();
                    if ($('#dialog-player-register-chkpassword').val() === password) {
                        dialog.dialog("close");
                        GameData.register(username, password);
                    } else {
                        $('#dialog-player-login-tabs-register-text').text('Passwords don’t match!');
                    }
                });

                $('button#dialog-player-logout-button').click(function () {
                    dialog.dialog("close");
                    GameData.logout();
                });

                if (localStorage.getItem("username")) {
                    // Player is logged in
                    $("#dialog-player-login").hide();
                    $("#dialog-player-logout").show();

                    // Generate inventory list
                    $('table#inventory-table').empty();
                    $.each(GameData.gameobjects[GameData.current_player_id].relationships.inventory.data, function (i, item) {
                        var real_item = GameData.gameobjects[item.id];
                        var html = "<tr>";
                        html += "<td><img src='/api/v2/gameobject/" + real_item.id + '/image_raw/' + real_item.attributes.image + "' /></td>";
                        html += "<td>" + real_item.attributes.name + "</td>";
                        html += "</tr>";
                        var elem = $(html);
                        $('table#inventory-table').append(elem);
                    });

                    // Insert profile
                    $('#dialog-player-logout-tabs-profile-avatar-change').click(function () {
                        dialog.dialog("close");
                        return self.render_view('avatars', {
                            width: (window.innerWidth * 2 / 3),
                        });
                    });
                    $('#dialog-player-logout-tabs-profile-avatar-image').attr('src', '/api/v2/gameobject/' + GameData.current_player_id + '/image_raw/' + GameData.gameobjects[GameData.current_player_id].attributes.image)
                    //XXX FIXME: consider maximum width vs. dialogue width
                    .attr('height', window.innerHeight * 1 / 4);

                    // Generate world list
                    var worlds_select = $('select#worlds');
                    worlds_select.empty();
                    $.each(GameData.worlds, function (i, item) {
                        // Create a new select option
                        var option = $("<option>", {
                            value: item.id
                        });
                        option.text(item.attributes.name);

                        // Append to select box
                        worlds_select.append(option);
                    });
                    worlds_select.val(GameData.gameobjects[GameData.current_player_id].relationships.world.data.id);

                    // Bind event to worlds_select to handle world change action
                    worlds_select.change(function () {
                        // Close dialog
                        dialog.dialog("close");

                        // Pass on joining the world to GameData service
                        GameData.joinWorld(worlds_select.val());
                    });
                } else {
                    // Player is not logged in
                    $("#dialog-player-login").show();
                    $("#dialog-player-logout").hide();
                }
                // end of “player” view
            } else if (view == 'avatars') {
                GameData.doRequestJSON('GET', '/api/v2/gameobject/' + GameData.current_player_id + '/available_images', avatars_handler);
                // end of “avatars” view
            } else if (view == 'popup') {
                var gameobject = opts.gameobject;

                //XXX FIXME: move this all to an HTML fragment
                var html = "<img class='map_popup_image' src='/api/v2/gameobject/" + gameobject.id + '/image_raw/' + gameobject.attributes.image + "' />";
                var p = '<p>';
                var sp = '';

                if (gameobject.attributes.gameobject_type == "gameobject_item") {
                    // FIXME also check for collectible
                    html += p + "<button class='map_popup_button' onClick='CamView.item_collect(" + gameobject.id + ")'>Collect</button>";
                    p = '';
                    sp = '</p>';
                }
                if (gameobject.attributes.gameobject_type == "gameobject_npc") {
                    // FIXME also check for talkable
                    html += p + "<button class='map_popup_button' onClick='CamView.npc_talk(" + gameobject.id + ")'>Talk</button>";
                    p = '';
                    sp = '</p>';
                }
                html += sp;
                var elem = $(html);
                dialog.append(elem);
                // end of “popup” view
            } else if (view == 'message') {
                //XXX FIXME: move this all to an HTML fragment
                var html = "<p>" + opts.message + "</p>";

                var elem = $(html);
                dialog.append(elem);
                // end of “message” view
            }
        });
    };

    self.control_click = function () {
        var dialogs = ["player"];

        var view = $(this).attr("id").substr(8);
        if (dialogs.indexOf(view) > -1) {
            self.render_view(view);
        } else if (view == "view") {
            Veripeditus.nextView();
        }
    };

    self.needle = $("#compass-needle");
    self.onOrientationChanged = function () {
        self.needle.css("transform", "rotateZ(" + Device.orientation.heading + "deg)");
    };

    $('div.control').on("click", self.control_click);
};

UI = new UIService();
Veripeditus.registerService(UI);
