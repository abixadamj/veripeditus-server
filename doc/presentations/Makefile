# veripeditus-server - Presentational material - build system
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
#
# Alternatively, you can use this file under GPL-2+, LGPL-2+,
# CC-BY-4.0+, MIT or MirOS.

ARTWORK = artwork-logo.pdf artwork-logo-with-name-h.pdf artwork-tshirt-back.pdf artwork-tshirt-front.pdf
PDF     = 2017-02-04_fosdem.pdf
FORMAT ?= plain

ifeq ($(FORMAT), presentation)
	TEX_MACRO = veripeditusSecondScreen
endif
ifeq ($(FORMAT), notes)
	BEAMER_OPTS = notes=only
endif
ifeq ($(FORMAT), handout)
	BEAMER_OPTS = handout
endif
ifeq ($(FORMAT), plain)
	BEAMER_OPTS = presentation
endif

all: $(PDF)

artwork-%.pdf: ../artwork/%.svg
	inkscape -z -C --file="$<" --export-pdf="$@"

TEX_MACRO ?= veripeditusDummy

%.pdf: %.tex beamerthemeveripeditus.sty background.png ex_schoolkid.py $(ARTWORK)
	pdflatex -shell-escape '\def\${TEX_MACRO}{1} \PassOptionsToClass{$(BEAMER_OPTS)}{beamer} \input{$<}'
	pdflatex -shell-escape '\def\${TEX_MACRO}{1} \PassOptionsToClass{$(BEAMER_OPTS)}{beamer} \input{$<}'
	pdflatex -shell-escape '\def\${TEX_MACRO}{1} \PassOptionsToClass{$(BEAMER_OPTS)}{beamer} \input{$<}'

clean:
	rm -f *.aux *.log *.nav *.out *.snm *.toc
	rm -rf _minted*

mrproper: clean
	rm -rf *.pdf

.PHONY: all clean mrproper
.SECONDARY: $(ARTWORK)
