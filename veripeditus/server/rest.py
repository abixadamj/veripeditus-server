"""
API endpoint definitions
"""

# veripeditus-server - Server component for the Veripeditus game framework
# Copyright (C) 2016  Dominik George <nik@naturalnet.de>
# Copyright (c) 2015  Mirko Hoffmann <m.hoffmann@tarent.de>
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

from veripeditus.server.app import manager
from veripeditus.server.model import *

manager.create_api(Player, include_columns=['id', 'username', 'name', 'email', 'longitude', 'latitude'],
    methods=['GET', 'POST', 'DELETE', 'PATCH', 'PUT'])

manager.create_api(Game, include_columns=['id', 'package', 'name', 'version',
                                                'description', 'author', 'license'],
    methods=['GET'])