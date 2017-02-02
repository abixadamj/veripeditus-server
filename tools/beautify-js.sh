#!/bin/mksh

# Needs the libjavascript-beautifier-perl package.

if ! T=$(mktemp -d); then
	print -ru2 "E: cannot create temporary directory"
	exit 1
fi

sed 's/indent_size =>/space_after_anon_function => 1, &/' \
    <"$(whence -p js_beautify)" >"$T/js_beautify"
chmod +x "$T/js_beautify"

rv=0
find www/src/ -iname '*.js' -print0 |&
    while IFS= read -p -r -d '' f; do
	if ! "$T/js_beautify" -output="$T/dst" "$f"; then
		print -ru2 "W: error processing '$f'"
		rv=1
	fi
	print >>"$T/dst"
	mv -f "$T/dst" "$f"
done

rm -rf "$T"
exit $rv
