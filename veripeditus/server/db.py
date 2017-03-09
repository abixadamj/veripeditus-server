"""
Flask-SQLAlchemy stuff for veripeditus-server.
"""

# veripeditus-server - Server component for the Veripeditus game framework
# Copyright (C) 2016  Dominik George <nik@naturalnet.de>
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

# pragma pylint: disable=wrong-import-position
# pragma pylint: disable=unused-import

from veripeditus.server.app import APP

from flask_sqlalchemy import SQLAlchemy
from osmalchemy import OSMAlchemy

# Initialise SQLAlchemy and OSMAlchemy
DB = SQLAlchemy(APP)
OA = OSMAlchemy(DB, overpass=True if APP.config['OSMALCHEMY_ONLINE'] else None)

# Import model and create tables
import veripeditus.server.model
DB.create_all()

# Run initialisation code
from veripeditus.server.control import init
init()

# Import REST API
import veripeditus.server.rest
