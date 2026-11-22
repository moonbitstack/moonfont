// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// Container formats, as an interface. `decode` walks a table of these instead
// of a chain of magic-number branches, so a format this repository gains later
// is one entry and one package rather than an edit to the façade.

///|
/// One container format.
pub(open) trait Container {
  /// The format's name, used in a refusal that says what was expected.
  fn name(Self) -> String
  /// Whether this container opens with that four-byte signature.
  fn claims(Self, magic : Int32) -> Bool
  /// Every face the file holds.
  fn open(Self, bytes : BytesView, limits : @model.Limits) -> Array[TableSet] raise @model.Refused
}

///|
/// The plain sfnt container: a single font or a TrueType collection, whose
/// table directories are already where the readers expect them.
pub struct Sfnt {}

///|
pub fn Sfnt::new() -> Sfnt {
  Sfnt::{ }
}

///|
pub impl Container for Sfnt with fn name(self) {
  let _ = self
  "sfnt"
}

///|
pub impl Container for Sfnt with fn claims(self, magic) {
  let _ = self
  magic == 0x00010000 ||
  magic == 0x4F54544F ||
  magic == 0x74727565 ||
  magic == 0x74746366
}

///|
pub impl Container for Sfnt with fn open(self, bytes, limits) {
  let _ = self
  read(bytes, limits)
}
