#!/usr/bin/env python3

from setuptools import setup

setup(
    name='Veripeditus-Game-%EGGNAME%',
    version='%VERSION%',
    packages=[
              'veripeditus.game.%PKGNAME%',
             ],
    namespace_packages=[
                        'veripeditus.game',
                        'veripeditus',
                       ],
    include_package_data=True,
    package_data={
                  'veripeditus.game.%PKGNAME%': ['data/*'],
                 },
    zip_safe=False,
    install_requires=[
                      'Veripeditus',
                     ],
)
