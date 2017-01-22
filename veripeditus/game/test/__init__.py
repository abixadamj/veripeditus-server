# veripeditus-server - Server component for the Veripeditus game framework
# Copyright (C) 2016  Dominik George <nik@naturalnet.de>
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
DESCRIPTION = 'Collect and trade items with NPCs.'
AUTHOR = 'Eike Jesinghaus <eike@naturalnet.de>'
LICENSE = 'AGPL'
VERSION = f.VERSION

class Player(f.Player):
    pass

class Apple(f.Item):
#    spawn_osm = {"natural": "tree"}
    default_name = "Apple"
    owned_max = 10

class Beer(f.Item):
#    spawn_osm = {"amenity": "pub"}
    default_name = "Beer"
    owned_max = 10

class Kangoo(f.NPC):
    spawn_osm = {"highway": "bus_stop"}
    default_name = "Kangoo"
    default_image = "kangoo"

    def __init__(self):
        self.name = random.choice(("Thorsten", "Dominik", "foo", "bar", "nocheinname"))
        self.item = random.choice((Apple, Beer))
        self.amount = random.randint(1, 10)
        self.finished = False

    def on_talk(self):
        player = f.current_player()
        if player.has_items(*([self.item]*self.amount)) or self.finished:
            msg = self.say("Thanks!")
            player.drop_items(self.item)
            self.finished = True
        else:
            msg = self.say("I want %i of this: %s" % (self.amount, self.item.default_name))
        return msg