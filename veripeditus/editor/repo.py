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

from veripeditus.editor import DIR_LIVE
from veripeditus.editor.util import name_to_eggname, name_to_pkgname

import git
import os
import shutil
import sys

# Determine data directory of code editor
DATA_DIR = os.path.join(os.path.dirname(sys.modules["veripeditus.editor"].__file__), "data")

class GameRepo(git.Repo):
    @staticmethod
    def initial_commit(repo, pkgname):
        """ Commits an initial game template to the repo. """

        # Create directories to main package file
        os.makedirs(os.path.join(repo.working_dir, "veripeditus", "game", pkgname))

        # Create empty data dir with placeholder
        os.mkdir(os.path.join(repo.working_dir, "veripeditus", "game", pkgname, "data"))
        open(os.path.join(repo.working_dir, "veripeditus", "game", pkgname, "data", ".placeholder"),
             "a").close()

        # Copy template game files
        shutil.copyfile(os.path.join(DATA_DIR, "template_setup.py"),
                        os.path.join(repo.working_dir, "setup.py"))
        shutil.copyfile(os.path.join(DATA_DIR, "template_init.py"),
                        os.path.join(repo.working_dir, "veripeditus", "game", pkgname, "__init__.py"))

        # Add template files to index
        repo.index.add([os.path.join("veripeditus", "setup.py"),
                        os.path.join("veripeditus", "game", pkgname, "__init__.py"),
                        os.path.join("veripeditus", "game", pkgname, "data", ".placeholder")])

        # Commit
        repo.index.commit("Initial commit of template game files.")

        # Create the review branches
        repo.create_head("review", "HEAD")
        repo.create_head("reviewed", "HEAD")

    def __init__(self, name, eggname=None, pkgname=None, working_dir=None):
        # Determine defaults
        if eggname is None:
            eggname = name_to_eggname(name)
        if pkgname is None:
            pkgname = name_to_pkgname(name)
        if working_dir is None:
            working_dir = os.path.join(DIR_LIVE, eggname)

        self.working_dir = working_dir
        self.name = name
        self.eggname = eggname
        self.pkgname = pkgname

        # Init Git repo if it does not exist
        if not os.path.isdir(self.working_dir):
            repo = git.Repo.init(self.working_dir)
            GameRepo.initial_commit(repo, self.pkgname)

        # Call parent constructor to get us linked to the repo
        git.Repo.__init__(self, self.working_dir)
