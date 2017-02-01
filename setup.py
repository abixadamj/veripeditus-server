#!/usr/bin/env python3

# veripeditus-server - Server component for the Veripeditus game framework
# Copyright (C) 2016, 2017  Dominik George <nik@naturalnet.de>
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

import os
from setuptools import setup

setup(
    name='Veripeditus',
    version='1.0.0a1.dev0',
    long_description=__doc__,
    url="http://www.veripeditus.org",
    author="The Veripeditus Team and contributors",
    author_email="team@veripeditus.org",
    packages=[
              'veripeditus.framework',
              'veripeditus.server',
              'veripeditus.game.test',
             ],
    namespace_packages=[
                        'veripeditus',
                        'veripeditus.game',
                       ],
    include_package_data=True,
    package_data={
                  'veripeditus.framework': ['data/*'],
                  'veripeditus.game.test': ['data/*'],
                 },
    zip_safe=False,
    install_requires=[
                      'Flask>=0.10',
                      'Flask-Restless>=1.0.0b2.dev0',
                      'Flask-SQLAlchemy',
                      'gpxpy',
                      'OSMAlchemy',
                      'passlib',
                      'Shapely',
                      'SQLAlchemy>=1.1.0',
                      'SQLAlchemy-Utils',
                     ],
    test_suite='test',
    entry_points={
                  'console_scripts': [
                                      'veripeditus-standalone = veripeditus.server:server_main'
                                     ]
                 },
    classifiers=[
                 "Development Status :: 2 - Pre-Alpha",
                 "Environment :: Web Environment",
                 "Intended Audience :: Developers",
                 "Intended Audience :: Education",
                 "License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)",
                 "Programming Language :: Python :: 3 :: Only",
                 "Topic :: Education",
                 "Topic :: Games/Entertainment",
                 "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
                 "Topic :: Software Development :: Libraries :: Application Frameworks",
                ],
)
