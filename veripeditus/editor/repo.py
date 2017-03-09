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
from tempfile import mktemp

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
        repo.index.add([os.path.join("setup.py"),
                        os.path.join("veripeditus", "game", pkgname, "__init__.py"),
                        os.path.join("veripeditus", "game", pkgname, "data", ".placeholder")])

        # Commit
        repo.index.commit("Initial commit of template game files.")

        # Create the review branches
        repo.create_head("review", "HEAD")
        repo.create_head("reviewed", "HEAD")

    def replace_template_vars(self, **kwargs):
        """ Replaces the known template variables in the template files and commits. """

        # Only operate on clean repository
        if self.is_dirty():
            # FIXME use proper exception
            raise Exception("Repository is dirty.")

        for template_file in [os.path.join(self.working_dir, "setup.py"),
                              os.path.join(self.working_dir, "veripeditus", "game", self.pkgname, "__init__.py")]:

            # Copy template to temp file
            temp_file = mktemp()
            shutil.copyfile(template_file, temp_file)

            # Read copy and write back to template, replacing variables
            with open(template_file, "w") as template, open(temp_file, "r") as temp:
                contents = temp.read()
                contents.replace("%NAME%", self.name)
                contents.replace("%EGGNAME%", self.eggname)
                contents.replace("%PKGNAME%", self.pkgname)
                contents.replace("%VERSION%", self.version)
                template.write(contents)

            # Add modified files to index and commit
            self.index.add([os.path.join("setup.py"),
                            os.path.join("veripeditus", "game", self.pkgname, "__init__.py")])
            self.index.commit("Replace template variables.")

    def __init__(self, name, eggname=None, pkgname=None, version=None, working_dir=None):
        # Determine defaults
        if eggname is None:
            eggname = name_to_eggname(name)
        if pkgname is None:
            pkgname = name_to_pkgname(name)
        if version is None:
            version = "0.1"
        if working_dir is None:
            working_dir = os.path.join(DIR_LIVE, eggname)

        self.working_dir = working_dir
        self.name = name
        self.eggname = eggname
        self.pkgname = pkgname
        self.version = version

        # Init Git repo if it does not exist
        if not os.path.isdir(self.working_dir):
            repo = git.Repo.init(self.working_dir)
            GameRepo.initial_commit(repo, self.pkgname)

        # Call parent constructor to get us linked to the repo
        git.Repo.__init__(self, self.working_dir)

        # Replace template variables in initial commit
        self.replace_template_vars()
