# The interface is the source of truth and the site is derived from it.
# `make api` is the one command that exports the newest MoonBit interfaces and
# regenerates the static pages. Nothing here needs a network connection beyond
# the toolchain's own dependency resolution.

.PHONY: check test fmt api docs site embed

check:
	moon check --target all --deny-warn

test:
	moon test --target all

fmt:
	moon fmt

# Rebuild the in-source corpus fixtures from integration/difftest/corpus/.
# The library performs no I/O, so each hostile font is compiled in as a byte
# literal; run this after changing the corpus or its manifest.
embed:
	python3 scripts/difftest/embed_corpus.py

# Export the public interface of every package, then rebuild docs/api.html.
# Re-run this after changing any public signature or any `///` doc comment.
api:
	moon info --target all
	python3 scripts/docs/gen_api.py

# Verify rather than write: for a clean working tree this is what CI runs.
docs:
	python3 scripts/docs/gen_api.py --check

# Rebuild every derived artefact, including the differential-test fixtures'
# index, without touching hand-written pages.
site: api
	python3 scripts/difftest/index_fixtures.py
