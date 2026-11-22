// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// `fvar` declares what a variable font varies: the axes with their user-space
// range, and the named instances a design offers. A caller reads the axes to
// build a user interface and the instances to offer presets; neither needs the
// glyph data to be touched.

///|
/// One axis, in user space. `min`, `default_value` and `max` are 16.16 fixed
/// point, so 14.5 is 950_272 and 1.0 is 65_536.
#derive(Eq, Debug)
pub(all) struct Axis {
  tag : Int32
  min : Int32
  default_value : Int32
  max : Int32
  flags : Int32
  name_id : Int32
}

///|
pub fn Axis::tag_name(self : Axis) -> String {
  tag_name(self.tag)
}

///|
/// The axis cannot be set by the user; it is driven by the application instead.
pub fn Axis::is_hidden(self : Axis) -> Bool {
  (self.flags & 0x0001) != 0
}

///|
/// One named instance: a point in the design space and the name to show.
#derive(Eq, Debug)
pub(all) struct Instance {
  subfamily_name_id : Int32
  /// One 16.16 user-space value per axis, in `fvar` order.
  coords : Array[Int32]
}

///|
/// The `fvar` table.
#derive(Eq, Debug)
pub(all) struct Fvar {
  axes : Array[Axis]
  instances : Array[Instance]
}

///|
pub fn Fvar::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> Fvar raise @model.Refused {
  let table_length = cursor.length()
  cursor.seek(0)
  let major = cursor.u16()
  let minor = cursor.u16()
  if major != 1 {
    raise @model.Unsupported(at=0, got="fvar version \{major}.\{minor}")
  }
  let axes_offset = cursor.u16()
  cursor.skip(2)
  let axis_count = cursor.u16()
  let axis_size = cursor.u16()
  let instance_count = cursor.u16()
  let instance_size = cursor.u16()
  if axis_count <= 0 {
    raise @model.Malformed(at=8, got="an fvar table with no axes")
  }
  if axis_size < 20 {
    raise @model.Malformed(at=10, got="fvar axisSize of \{axis_size}")
  }
  limits.check_glyphs(axis_count)
  if axes_offset.to_int64() + axis_count.to_int64() * axis_size.to_int64() >
    table_length.to_int64() {
    raise @model.Truncated(at=axes_offset, want=axis_count * axis_size)
  }
  cursor.seek(axes_offset)
  let axes : Array[Axis] = []
  for _ in 0..<axis_count {
    let start = cursor.position()
    let tag = cursor.tag()
    let min = cursor.u32()
    let default_value = cursor.u32()
    let max = cursor.u32()
    let flags = cursor.u16()
    let name_id = cursor.u16()
    if min > default_value || default_value > max {
      raise @model.Malformed(
        at=start,
        got="an fvar axis whose range does not contain its default",
      )
    }
    axes.push({ tag, min, default_value, max, flags, name_id, })
    cursor.seek(start + axis_size)
  }
  let minimum_instance = 4 + 4 * axis_count
  let instances : Array[Instance] = []
  if instance_count > 0 && instance_size >= minimum_instance {
    for _ in 0..<instance_count {
      let start = cursor.position()
      let subfamily_name_id = cursor.u16()
      cursor.skip(2)
      let coords : Array[Int32] = []
      for _ in 0..<axis_count {
        coords.push(cursor.u32())
      }
      instances.push({ subfamily_name_id, coords, })
      cursor.seek(start + instance_size)
    }
  }
  { axes, instances, }
}

///|
/// A point in the design space, one 16.16 user-space value per axis. Holding
/// user values rather than normalised ones means a caller can show the number
/// it set, and the axis order is the only thing it has to agree with `fvar`
/// about.
#derive(Eq, Debug)
pub(all) struct Location {
  coords : Array[Int32]
}

///|
/// The default instance: every axis at its `fvar` default.
pub fn Location::default(fvar : Fvar) -> Location {
  let coords : Array[Int32] = []
  for axis in fvar.axes {
    coords.push(axis.default_value)
  }
  { coords, }
}

///|
/// A location from user-space axis values. Axes the caller does not name keep
/// their default; an unknown tag is ignored, because a design may be driven by
/// an application that knows more axes than this font has.
pub fn Location::of(fvar : Fvar, values : Array[(Int32, Int32)]) -> Location {
  let location = Location::default(fvar)
  for pair in values {
    let (axis, value) = pair
    location.set(fvar, axis, value)
  }
  location
}

///|
/// Set one axis by its four-character tag.
pub fn Location::set(
  self : Location,
  fvar : Fvar,
  axis : Int32,
  value : Int32,
) -> Unit {
  for i in 0..<fvar.axes.length() {
    if fvar.axes[i].tag == axis {
      self.set_axis(i, value)
    }
  }
}

///|
/// Read one axis by its four-character tag.
pub fn Location::at(self : Location, fvar : Fvar, axis : Int32) -> Int32 {
  for i in 0..<fvar.axes.length() {
    if fvar.axes[i].tag == axis {
      return self.get(i)
    }
  }
  0
}

///|
/// Read one axis value.
pub fn Location::get(self : Location, index : Int32) -> Int32 {
  if index < 0 || index >= self.coords.length() {
    0
  } else {
    self.coords[index]
  }
}

///|
/// Set one axis by index.
pub fn Location::set_axis(
  self : Location,
  index : Int32,
  value : Int32,
) -> Unit {
  if index >= 0 && index < self.coords.length() {
    self.coords[index] = value
  }
}

///|
/// The normalised F2Dot14 coordinates every table interpolates with, after the
/// axis map in `avar` if the font has one. Values outside the axis range are
/// clamped: a caller that asks for 1000 weight in a 100..900 axis gets the
/// heaviest instance rather than an extrapolation.
pub fn Location::normalise(
  self : Location,
  fvar : Fvar,
  avar? : Avar,
) -> Array[Int32] {
  let out : Array[Int32] = []
  for i in 0..<fvar.axes.length() {
    let axis = fvar.axes[i]
    let mut value = self.get(i)
    if value < axis.min {
      value = axis.min
    }
    if value > axis.max {
      value = axis.max
    }
    let mut normalised = if value == axis.default_value {
      0
    } else if value < axis.default_value {
      @wire.div_round(
        (value - axis.default_value).to_int64() * 16384,
        (axis.default_value - axis.min).to_int64(),
      )
    } else {
      @wire.div_round(
        (value - axis.default_value).to_int64() * 16384,
        (axis.max - axis.default_value).to_int64(),
      )
    }
    if normalised < -16384 {
      normalised = -16384
    }
    if normalised > 16384 {
      normalised = 16384
    }
    match avar {
      Some(table) => normalised = table.map_axis(i, normalised)
      None => ()
    }
    out.push(normalised)
  }
  out
}
