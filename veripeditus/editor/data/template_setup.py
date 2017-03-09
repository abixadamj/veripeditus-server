#!/usr/bin/env python3

from setuptools import setup

setup(
    name='Veripeditus-Game-%PKGNAME%',
    version='%VERSION%',
    packages=[
              'veripeditus.game.%MODNAME%',
             ],
    namespace_packages=[
                        'veripeditus.game',
                        'veripeditus',
                       ],
    include_package_data=True,
    package_data={
                  'veripeditus.game.%MODNAME%': ['data/*'],
                 },
    zip_safe=False,
    install_requires=[
                      'Veripeditus',
                     ],
)
