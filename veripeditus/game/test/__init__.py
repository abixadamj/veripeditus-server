# veripeditus-server - Server component for the Veripeditus game framework
# Copyright (C) 2017  Eike Tim Jesinghaus <eike@naturalnet.de>
# Copyright (C) 2017  Dominik George <nik@naturalnet.de>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version, with the Game Cartridge Exception.
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
    spawn_osm = {"natural": "tree"}
    default_name = "Apple"
    default_image = "apple"
    owned_max = 10

class Beer(f.Item):
    spawn_osm = {"amenity": "pub"}
    default_name = "Beer"
    default_image = "beer"
    owned_max = 10

class Kangoo(f.NPC):
    spawn_osm = {"highway": "bus_stop"}
    default_name = "Kangoo"
    default_image = "avatar_kangoo"

    def __init__(self):
        self.name = random.choice(("Thorsten", "Dominik", "foo", "bar", "nocheinname"))
        self.attribute("item", random.choice(("apple", "beer")))
        self.attribute("amount", str(random.randint(1, 10)))
        self.attribute("finished", "false")

    def on_talk(self):
        player = f.current_player()

        items_map = {"apple": Apple, "beer": Beer}

        if player.has_item(items_map[self.attribute("item")]) >= int(self.attribute("amount")) or self.attribute("finished") == "true":
            player.drop_items(items_map[self.attribute("item")])
            self.attribute("finished", "true")
            return self.say("Thanks!")
        else:
            return self.say("I want %s of this: %s" % (self.attribute("amount"), items_map[self.attribute("item")].default_name))

class Null(f.Location):
    spawn_latlon = (0.0, 0.0)

    def on_pass(self, player):
        print("passed")
