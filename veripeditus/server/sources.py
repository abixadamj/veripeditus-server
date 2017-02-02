"""
Source access module

This module provides access to the source code of the server, the
framework and all known games in compliance with the AGPL.
"""

# veripeditus-server - Server component for the Veripeditus game framework
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

from glob import glob
from io import BytesIO
import os
import sys
import tarfile

from veripeditus.server.util import get_games

_RELEVANT_PATTERNS = ["*.py", os.path.join("data", "*")]
_RELEVANT_MODULES = [sys.modules["veripeditus.server"],
                     sys.modules["veripeditus.framework"]] + list(get_games().values())

def get_module_sources(module, patterns=_RELEVANT_PATTERNS):
    """ Get all sources for a Python module's package. """

    # Find path to package
    path = os.path.dirname(module.__file__)

    # Find all relevant files
    files = []
    for pattern in patterns:
        files += glob(os.path.join(path, pattern), recursive=True)

    # Build dictionary of file names and file contents
    res = {}
    for filename in files:
        relname = os.path.relpath(filename, start=path)

        with open(filename, "rb") as file:
            res[relname] = file.read()

    # Return resulting dictionary
    return res

def get_sources(modules=_RELEVANT_MODULES, patterns=_RELEVANT_PATTERNS):
    """ Get all sources for all relevant modules. """

    # Assemble sources for all games
    res = {}
    for module in modules:
        res[module.__name__] = get_module_sources(module, patterns)

    # Return resulting dictionary
    return res

def sources_to_tarball(sources):
    """ Convert a source dictionary into a tarball.

    Takes a source dictionary from get_sources and builds a tarball from
    it.
    """

    # Open an in-memory file
    memfile = BytesIO()

    # Assemble tarball
    with tarfile.open(mode="x:xz", fileobj=memfile) as tar:
        # Walk through all module code and add it
        for module_name, module_sources  in sources.items():
            for file_name, file_sources in module_sources.items():
                tarinfo = tarfile.TarInfo(name="/".join([module_name.replace(".", "/"), file_name]))
                tarinfo.size = len(file_sources)
                tarinfo.uid = tarinfo.gid = 0
                tarinfo.uname = tarinfo.gname = "root"
                tarinfo.type = tarfile.REGTYPE
                tar.addfile(tarinfo, BytesIO(file_sources))

    # Seek to beginning, get contents and return
    memfile.seek(0, 0)
    return memfile.read()
