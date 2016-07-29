# Veripeditus AR Game Server

Server component for the Veripeditus augmented-reality game framework

## What is Veripeditus?

Veripeditus (from Latin „veritas“ → „truth“ and „pedis“ → „foot“) is a
client/server augmented reality gaming engine and framework. It allows
writing game „cartridges“ for the server, which it can then run. Players
access the game while being outside with a mobile device.

## Reference games

While developing the framework, two reference games are developed:

 * [Verimagica](https://github.com/Veripeditus/game-verimagica),
   a fantasy game about magic, designed by Eike
 * [Ingressio](https://github.com/Veripeditus/game-ingressio),
   a clone of the popular Ingress game, designed by Nik

## Development

The server component, the framework and the games are developed in pure
Python. There are a few design/development principles:

 * Game cartridges must be easy to develop with basic Python skills
 * The framework and engine must be dynamic enough to allow a large
   number of different game types to be developed
 * The framework must not carry any code that is specific to only
   a single type of game
 * Development is test-driven and test-first
 * pylint is to be used and obeyed
 * Code must at all times be compatible with Python versions in Debian
   stable and Debian unstable

### Code state

The CI state represents the results from unit tests, pylint and coverage
assessment.

[![Build Status](https://scrutinizer-ci.com/g/Veripeditus/veripeditus-server/badges/build.png?b=master)](https://scrutinizer-ci.com/g/Veripeditus/veripeditus-server/build-status/master)
[![Code Coverage](https://scrutinizer-ci.com/g/Veripeditus/veripeditus-server/badges/coverage.png?b=master)](https://scrutinizer-ci.com/g/Veripeditus/veripeditus-server/?branch=master)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Veripeditus/veripeditus-server/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Veripeditus/veripeditus-server/?branch=master)

## Features of the web frontend

The web frontend was originally intended to provide a quick view into
the game state on a Veripeditus server. It has, however, developed to
become a full-featured client for playing.

Depending on how cool HTML5 turns out to be, it might become the
official client and thus the first real-world HTML5 location based
real-time game.

### Browser compatibility

The Veripeditus web frontend is developed and tested exactly on Mozilla
Firefox as there are no other free browsers that support HTML5 in a
reasonable way and can be entrusted with privacy critical data like
geolocation of a user.

Mozilla Firefox is available in any serious Linux distribution, as well
as for Android from the free [F-Droid](https://f-droid.org) app store.
Rumour has it that there is also a version for iOS.

## Testing system

A testing system is available at http://nightly.veripeditus.org/ . This
machine is a Docker container that is auto-deployed from the latest Git
commit.

It is unstable and might be broken. It will also lose data regularly.

## Authors

The authors and lead developers of Veripeditus are…

 * … Eike Time Jesinghaus <<eike@naturalnet.de>>, a young Python and PyGame
   developer, born 2001 (14 years old at the time the project started)
   and an expert Python and PyGame developer and tutor since his 11ᵗʰ
   birthday, and …
 * … Dominik George <<nik@naturalnet.de>>, formerly teacher of Eike, now
   at times his trainee regarding Python magic.

## Licence

The project is licenced under the GNU Affero GeneralPublic License
version 3 or later. All artwork and other non-code parts are also
dual-licenced under the Creative Commons-Attribution-Share Alike 4.0
Unported licence (or later). See the
[COPYING](https://github.com/Veripeditus/veripeditus-server/blob/master/COPYING)
file for more details.
