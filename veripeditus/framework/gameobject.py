"""
Parent object for all Veripeditus game objects
Never used directly, only inherited by other framework classes.
"""

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

from veripeditus.framework.util import get_game_data_object

class GameObject(object):
    """
    Parent object for all Veripeditus game objects
    Never used directly, only inherited by other framework classes.
    """

    def __init__(self, **kwargs):
        """
        Initialise basic attributes of a game object.

        Optional keyword arguments:

        name -- Display name of the object
        image -- Name of an image resource, to be loaded from
                 the instantiating module's data directory
        """

        if "name" in kwargs:
            self.name = kwargs["name"]
        if "image" in kwargs:
            self.image = get_game_data_object("image", kwargs["image"])
