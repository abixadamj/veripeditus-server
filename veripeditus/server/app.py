"""
Main server application
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

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from osmalchemy import OSMAlchemy

APP = Flask(__name__)

# FIXME allow modification after module import
APP.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
APP.config['PASSWORD_SCHEMES'] = ['pbkdf2_sha512', 'md5_crypt']
APP.config['BASIC_REALM'] = "Veripeditus"
APP.config['ENABLE_CODE_EDITOR'] = False

CFGLIST = ['/var/lib/veripeditus/dbconfig.cfg', '/etc/veripeditus/server.cfg']
for cfg in CFGLIST:
    APP.config.from_pyfile(cfg, silent=True)

DB = SQLAlchemy(APP)
OA = OSMAlchemy(DB, overpass=True)
import veripeditus.server.model
DB.create_all()

from veripeditus.server.control import init
init()

import veripeditus.server.rest

if APP.config['ENABLE_CODE_EDITOR']:
    import veripeditus.editor
