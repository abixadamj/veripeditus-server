# veripeditus-server - Server component for the Veripeditus game framework
# Copyright (C) 2017  Eike Tim Jesinghaus <eike@naturalnet.de>
# Copyright (C) 2017  Dominik George <nik@naturalnet.de>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import random

from veripeditus import framework as f

NAME = 'Veripeditus Test Game'
DESCRIPTION = 'Location test'
AUTHOR = 'Eike Jesinghaus <eike@naturalnet.de>'
LICENSE = 'AGPL'
VERSION = f.VERSION

class Player(f.Player):
    pass

class FooLoc(f.Location):
    spawn_osm = {"natural":"tree"}
    max_distance = 5

    def on_pass(self, player):
        return self.say("foo")
