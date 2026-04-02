// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// One refusal for the whole library. A font is untrusted input: a caller needs
// a single handler whichever table went wrong, and a bug report needs the byte
// offset. The four shapes answer the four questions a caller actually asks: is
// this not a font (Unknown), is it damaged (Truncated, Malformed), is it a part
// we do not read (Unsupported, MissingTable), or did it ask for more than the
// caller allowed (OverLimit, Recursion).

///|
/// A refusal to read bytes as a font, or to turn a glyph into a bitmap.
#derive(Eq, Debug)
pub(all) suberror Refused {
  /// The signature at `at` is not one this library reads.
  Unknown(at~ : Int32, got~ : String)
  /// The bytes at `at` are not allowed here; `want` says what would be.
  Unexpected(at~ : Int32, got~ : String, want~ : String)
  /// A well-formed part of the format that this library does not read yet.
  Unsupported(at~ : Int32, got~ : String)
  /// The bytes end `want` short of where the format needs them.
  Truncated(at~ : Int32, want~ : Int32)
  /// A declaration past the caller's ceiling.
  OverLimit(limit~ : Int32, got~ : Int32)
  /// A structurally impossible value in an otherwise readable table.
  Malformed(at~ : Int32, got~ : String)
  /// A required table is absent from the directory.
  MissingTable(tag~ : String)
  /// A glyph id outside `maxp.numGlyphs`.
  MissingGlyph(glyph~ : Int32)
  /// Composite glyphs nested past the caller's recursion ceiling.
  Recursion(depth~ : Int32)
}

///|
pub extend Refused with Eq::{equal, not_equal}

///|
pub extend Refused with Debug::{to_repr}

///|
pub impl Show for Refused with fn output(self, logger) {
  logger.write_string(
    match self {
      Unknown(at~, got~) => "at \{at}: \{got} is not a font this library reads"
      Unexpected(at~, got~, want~) => "at \{at}: got \{got}, want \{want}"
      Unsupported(at~, got~) => "at \{at}: \{got} is not supported"
      Truncated(at~, want~) => "at \{at}: \{want} bytes wanted"
      OverLimit(limit~, got~) => "over limit: \{got} beyond \{limit}"
      Malformed(at~, got~) => "at \{at}: \{got}"
      MissingTable(tag~) => "missing table: \{tag}"
      MissingGlyph(glyph~) => "missing glyph: \{glyph}"
      Recursion(depth~) => "composite glyph nested past \{depth}"
    },
  )
}

///|
pub extend Refused with Show::{to_string, output}
