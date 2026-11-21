// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The two transforms WOFF 2 applies to TrueType data. `glyf` is split into
// seven streams so that point counts, flags, coordinates and boxes compress
// separately; rebuilding it means walking a triplet encoding, then writing an
// ordinary glyph record. `loca` is not stored at all when `glyf` is
// transformed, and `hmtx` drops the side bearings that the glyph boxes already
// imply.

///|
/// One simple glyph, decoded but not yet written back.
priv struct Simple {
  contours : Array[Int32]
  xs : Array[Int32]
  ys : Array[Int32]
  on_curve : Array[Bool]
  instructions : BytesView
  bbox : Array[Int32]?
}

///|
/// One component of a composite glyph.
priv struct Component {
  glyph : Int32
  dx : Int32
  dy : Int32
  a : Int32
  b : Int32
  c : Int32
  d : Int32
}

///|
/// One composite glyph: the component bytes exactly as they arrive, plus what
/// is needed to derive a box when the transform omitted it.
priv struct Composite {
  raw : Array[Byte]
  components : Array[Component]
  bbox : Array[Int32]?
}

///|
/// A decoded glyph, before its box is known for certain.
priv enum Decoded {
  Blank
  Draw(Simple)
  Combine(Composite)
}

///|
/// Rebuild `glyf` and `loca` from the transformed table. Also returns each
/// glyph's `xMin`, which the `hmtx` transform needs.
fn rebuild_glyf(
  data : BytesView,
  limits : @model.Limits,
) -> (Bytes, Bytes, Array[Int32]) raise @model.Refused {
  let header = Stream::new(data)
  let version = header.u16()
  if version != 0 {
    raise @model.Unsupported(at=0, got="a transformed glyf version \{version}")
  }
  let option_flags = header.u16()
  let num_glyphs = header.u16()
  let index_format = header.u16()
  limits.check_glyphs(num_glyphs)
  let n_contour_size = header.u32()
  let n_points_size = header.u32()
  let flag_size = header.u32()
  let glyph_size = header.u32()
  let composite_size = header.u32()
  let bbox_size = header.u32()
  let instruction_size = header.u32()
  // Eight header bytes, then the seven stream sizes: the streams begin at 36.
  let mut at = 36
  let n_contour_at = at
  at += n_contour_size
  let n_points_at = at
  at += n_points_size
  let flag_at = at
  at += flag_size
  let glyph_at = at
  at += glyph_size
  let composite_at = at
  at += composite_size
  let bbox_at = at
  at += bbox_size
  let instruction_at = at
  at += instruction_size
  if at > data.length() {
    raise @model.Truncated(at=data.length(), want=at - data.length())
  }
  // A bitmap of glyphs whose contours overlap may follow the streams; it is a
  // rasterisation hint this library does not need, so it is stepped over.
  if (option_flags & 0x0001) != 0 {
    at += (num_glyphs + 7) / 8
  }
  if at != data.length() {
    raise @model.Malformed(
      at=data.length(),
      got="a transformed glyf of \{data.length()} bytes",
    )
  }
  let n_contour = Stream::new(
    data.clamped_view(start=n_contour_at, end=n_contour_at + n_contour_size),
  )
  let n_points = Stream::new(
    data.clamped_view(start=n_points_at, end=n_points_at + n_points_size),
  )
  let flags = Stream::new(
    data.clamped_view(start=flag_at, end=flag_at + flag_size),
  )
  let glyphs = Stream::new(
    data.clamped_view(start=glyph_at, end=glyph_at + glyph_size),
  )
  let composites = Stream::new(
    data.clamped_view(start=composite_at, end=composite_at + composite_size),
  )
  let bbox_bitmap_size = ((num_glyphs + 31) >> 5) * 4
  if bbox_bitmap_size > bbox_size {
    raise @model.Malformed(at=bbox_at, got="a short bounding-box bitmap")
  }
  let bbox_bitmap = data.clamped_view(
    start=bbox_at,
    end=bbox_at + bbox_bitmap_size,
  )
  let boxes = Stream::new(
    data.clamped_view(start=bbox_at + bbox_bitmap_size, end=bbox_at + bbox_size),
  )
  let instructions = Stream::new(
    data.clamped_view(
      start=instruction_at,
      end=instruction_at + instruction_size,
    ),
  )
  let decoded : Array[Decoded] = []
  for glyph in 0..<num_glyphs {
    let contours = n_contour.i16()
    let explicit = if has_box(bbox_bitmap, glyph) {
      Some([boxes.i16(), boxes.i16(), boxes.i16(), boxes.i16()])
    } else {
      None
    }
    if contours == 0 {
      decoded.push(Blank)
    } else if contours > 0 {
      let ends : Array[Int32] = []
      let mut points = 0
      for _ in 0..<contours {
        let count = read_255(n_points)
        points += count
        ends.push(points - 1)
      }
      limits.check_outline(points, contours)
      let xs : Array[Int32] = []
      let ys : Array[Int32] = []
      let on_curve : Array[Bool] = []
      let mut x = 0
      let mut y = 0
      for _ in 0..<points {
        let flag = flags.u8()
        on_curve.push((flag & 0x80) == 0)
        let (dx, dy) = read_triplet(flag & 0x7F, glyphs)
        x += dx
        y += dy
        xs.push(x)
        ys.push(y)
      }
      let length = read_255(glyphs)
      let body = instructions.take(length)
      decoded.push(
        Draw({
          contours: ends,
          xs,
          ys,
          on_curve,
          instructions: body,
          bbox: explicit,
        }),
      )
    } else {
      let raw : Array[Byte] = []
      let components : Array[Component] = []
      let mut more = true
      let mut wants_instructions = false
      while more {
        let record = composites
        let flags_at = record.pos
        let component_flags = record.u16()
        let glyph_index = record.u16()
        if (component_flags & 0x0100) != 0 {
          wants_instructions = true
        }
        let words = (component_flags & 0x0001) != 0
        let dx = if words { record.i16() } else { record.i8() }
        let dy = if words { record.i16() } else { record.i8() }
        let mut a = 16384
        let mut b = 0
        let mut c = 0
        let mut d = 16384
        if (component_flags & 0x0008) != 0 {
          a = record.i16()
          d = a
        } else if (component_flags & 0x0040) != 0 {
          a = record.i16()
          d = record.i16()
        } else if (component_flags & 0x0080) != 0 {
          a = record.i16()
          b = record.i16()
          c = record.i16()
          d = record.i16()
        }
        for k in flags_at..<record.pos {
          raw.push(composites.data[k])
        }
        components.push({ glyph: glyph_index, dx, dy, a, b, c, d, })
        limits.check_composites(components.length())
        more = (component_flags & 0x0020) != 0
      }
      if wants_instructions {
        let length = read_255(glyphs)
        let body = instructions.take(length)
        raw.push((length >> 8).to_byte())
        raw.push(length.to_byte())
        for k in 0..<body.length() {
          raw.push(body[k])
        }
      }
      decoded.push(Combine({ raw, components, bbox: explicit, }))
    }
  }
  let boxes = resolve_boxes(decoded, num_glyphs)
  let glyph_writer = Writer::new()
  let offsets : Array[Int32] = []
  let x_mins : Array[Int32] = []
  for glyph in 0..<num_glyphs {
    offsets.push(glyph_writer.length())
    let box = boxes[glyph]
    x_mins.push(box[0])
    match decoded[glyph] {
      Blank => ()
      Draw(simple) => write_simple(glyph_writer, simple, box)
      Combine(composite) => write_composite(glyph_writer, composite, box)
    }
    glyph_writer.align(4)
  }
  offsets.push(glyph_writer.length())
  let loca_writer = Writer::new()
  if index_format == 0 {
    for offset in offsets {
      loca_writer.u16(offset / 2)
    }
  } else {
    for offset in offsets {
      loca_writer.u32(offset)
    }
  }
  (glyph_writer.to_bytes(), loca_writer.to_bytes(), x_mins)
}

///|
fn has_box(bitmap : BytesView, glyph : Int32) -> Bool {
  let at = (glyph >> 5) * 4 + ((glyph & 31) >> 3)
  if at < 0 || at >= bitmap.length() {
    false
  } else {
    (bitmap[at].to_int() & (0x80 >> (glyph & 7).to_int())) != 0
  }
}

///|
/// The box of a simple glyph from its points: what the transform leaves out
/// when the box is exactly what the outline implies.
fn measure(simple : Simple) -> Array[Int32] {
  let mut x_min = 0
  let mut y_min = 0
  let mut x_max = 0
  let mut y_max = 0
  if simple.xs.length() > 0 {
    x_min = simple.xs[0]
    x_max = simple.xs[0]
    y_min = simple.ys[0]
    y_max = simple.ys[0]
  }
  for i in 0..<simple.xs.length() {
    if simple.xs[i] < x_min {
      x_min = simple.xs[i]
    }
    if simple.xs[i] > x_max {
      x_max = simple.xs[i]
    }
    if simple.ys[i] < y_min {
      y_min = simple.ys[i]
    }
    if simple.ys[i] > y_max {
      y_max = simple.ys[i]
    }
  }
  [x_min, y_min, x_max, y_max]
}

///|
/// Fill in the boxes a composite glyph left out, from the boxes of the glyphs
/// it is built from. A component may name a glyph that comes later, so this
/// repeats until nothing changes.
fn resolve_boxes(
  decoded : Array[Decoded],
  num_glyphs : Int32,
) -> Array[Array[Int32]] {
  let boxes : Array[Array[Int32]?] = []
  for i in 0..<num_glyphs {
    boxes.push(
      match decoded[i] {
        Blank => Some([0, 0, 0, 0])
        Draw(simple) =>
          match simple.bbox {
            Some(box) => Some(box)
            None => Some(measure(simple))
          }
        Combine(composite) => composite.bbox
      },
    )
  }
  let mut changed = true
  let mut rounds = 0
  while changed && rounds <= num_glyphs {
    changed = false
    rounds += 1
    for i in 0..<num_glyphs {
      if boxes[i] is None {
        match decoded[i] {
          Combine(composite) => {
            let mut box : Array[Int32]? = None
            let mut complete = true
            for component in composite.components {
              if component.glyph < 0 || component.glyph >= num_glyphs {
                complete = false
              } else {
                match boxes[component.glyph] {
                  Some(child) => {
                    let candidate = place(child, component)
                    box = Some(
                      match box {
                        Some(existing) => unite(existing, candidate)
                        None => candidate
                      },
                    )
                  }
                  None => complete = false
                }
              }
            }
            if complete {
              boxes[i] = box
              changed = true
            }
          }
          _ => ()
        }
      }
    }
  }
  let out : Array[Array[Int32]] = []
  for i in 0..<num_glyphs {
    out.push(
      match boxes[i] {
        Some(box) => box
        None => [0, 0, 0, 0]
      },
    )
  }
  out
}

///|
/// One component's box in the parent glyph's coordinates.
fn place(child : Array[Int32], component : Component) -> Array[Int32] {
  let corners = [
    (child[0], child[1]),
    (child[2], child[1]),
    (child[0], child[3]),
    (child[2], child[3]),
  ]
  let mut x_min = 0
  let mut y_min = 0
  let mut x_max = 0
  let mut y_max = 0
  let mut first = true
  for corner in corners {
    let (x, y) = corner
    let nx = div_round(
        x.to_int64() * component.a.to_int64() +
        y.to_int64() * component.c.to_int64(),
        16384,
      ) +
      component.dx
    let ny = div_round(
        x.to_int64() * component.b.to_int64() +
        y.to_int64() * component.d.to_int64(),
        16384,
      ) +
      component.dy
    if first {
      x_min = nx
      x_max = nx
      y_min = ny
      y_max = ny
      first = false
    } else {
      if nx < x_min {
        x_min = nx
      }
      if nx > x_max {
        x_max = nx
      }
      if ny < y_min {
        y_min = ny
      }
      if ny > y_max {
        y_max = ny
      }
    }
  }
  [x_min, y_min, x_max, y_max]
}

///|
fn unite(a : Array[Int32], b : Array[Int32]) -> Array[Int32] {
  [
    if a[0] < b[0] {
      a[0]
    } else {
      b[0]
    },
    if a[1] < b[1] {
      a[1]
    } else {
      b[1]
    },
    if a[2] > b[2] {
      a[2]
    } else {
      b[2]
    },
    if a[3] > b[3] {
      a[3]
    } else {
      b[3]
    },
  ]
}

///|
/// One glyph record: the header, the contour ends, the instructions, then flags
/// and 16-bit coordinate deltas. That is a legal encoding of any point set, and
/// the reader does not care that the writer did not try to shorten it.
fn write_simple(writer : Writer, simple : Simple, box : Array[Int32]) -> Unit {
  writer.i16(simple.contours.length())
  writer.i16(box[0])
  writer.i16(box[1])
  writer.i16(box[2])
  writer.i16(box[3])
  for end in simple.contours {
    writer.u16(end)
  }
  writer.u16(simple.instructions.length())
  writer.bytes(simple.instructions)
  for on in simple.on_curve {
    writer.byte(if on { 0x01 } else { 0x00 })
  }
  let mut previous = 0
  for x in simple.xs {
    writer.i16(x - previous)
    previous = x
  }
  previous = 0
  for y in simple.ys {
    writer.i16(y - previous)
    previous = y
  }
}

///|
fn write_composite(
  writer : Writer,
  composite : Composite,
  box : Array[Int32],
) -> Unit {
  writer.i16(-1)
  writer.i16(box[0])
  writer.i16(box[1])
  writer.i16(box[2])
  writer.i16(box[3])
  for byte in composite.raw {
    writer.byte(byte.to_int())
  }
}

///|
/// One triplet: how far this point sits from the one before, in one of the
/// seven width and sign combinations the format defines.
fn read_triplet(
  flag : Int32,
  stream : Stream,
) -> (Int32, Int32) raise @model.Refused {
  if flag < 10 {
    (0, with_sign(flag, ((flag & 14) << 7) + stream.u8()))
  } else if flag < 20 {
    (with_sign(flag, (((flag - 10) & 14) << 7) + stream.u8()), 0)
  } else if flag < 84 {
    let b0 = flag - 20
    let b1 = stream.u8()
    (
      with_sign(flag, 1 + (b0 & 0x30) + (b1 >> 4)),
      with_sign(flag >> 1, 1 + ((b0 & 0x0C) << 2) + (b1 & 0x0F)),
    )
  } else if flag < 120 {
    let b0 = flag - 84
    let x = with_sign(flag, 1 + ((b0 / 12) << 8) + stream.u8())
    let y = with_sign(flag >> 1, 1 + ((b0 % 12) >> 2 << 8) + stream.u8())
    (x, y)
  } else if flag < 124 {
    let b1 = stream.u8()
    let b2 = stream.u8()
    let b3 = stream.u8()
    (
      with_sign(flag, (b1 << 4) + (b2 >> 4)),
      with_sign(flag >> 1, ((b2 & 0x0F) << 8) + b3),
    )
  } else {
    let b1 = stream.u8()
    let b2 = stream.u8()
    let b3 = stream.u8()
    let b4 = stream.u8()
    let b5 = stream.u8()
    (
      with_sign(flag, (b1 << 12) + (b2 << 4) + (b3 >> 4)),
      with_sign(flag >> 1, ((b3 & 0x0F) << 16) + (b4 << 8) + b5),
    )
  }
}

///|
fn with_sign(flag : Int32, value : Int32) -> Int32 {
  if (flag & 1) != 0 {
    value
  } else {
    -value
  }
}

///|
/// Rebuild `hmtx`: the advance widths are stored, the side bearings are
/// re-derived from the glyph boxes the way the transform derived them.
fn rebuild_hmtx(
  data : BytesView,
  number_of_h_metrics : Int32,
  x_mins : Array[Int32],
) -> Bytes {
  let stream = Stream::new(data)
  let format = stream.u8() catch { _ => 0 }
  let metrics = if number_of_h_metrics <= 0 { 0 } else { number_of_h_metrics }
  let advances : Array[Int32] = []
  for _ in 0..<metrics {
    advances.push(stream.u16() catch { _ => 0 })
  }
  let glyph_count = x_mins.length()
  let side_bearings : Array[Int32] = []
  for i in 0..<glyph_count {
    let derived = if i < glyph_count { x_mins[i] } else { 0 }
    let value = if (format & 0x03) == 0 {
      derived
    } else if (format & 0x03) == 1 {
      if i < metrics {
        stream.u8() catch {
          _ => 0
        }
      } else {
        stream.u8() catch {
          _ => 0
        }
      }
    } else if (format & 0x03) == 2 {
      if i < metrics {
        stream.i16() catch {
          _ => 0
        }
      } else {
        stream.u8() catch {
          _ => 0
        }
      }
    } else {
      stream.i16() catch {
        _ => 0
      }
    }
    // An int8 side bearing is signed.
    side_bearings.push(
      if (format & 0x03) == 1 || ((format & 0x03) == 2 && i >= metrics) {
        if value >= 0x80 {
          value - 0x100
        } else {
          value
        }
      } else {
        value
      },
    )
  }
  let writer = Writer::new()
  for i in 0..<metrics {
    writer.u16(if i < advances.length() { advances[i] } else { 0 })
    writer.i16(if i < side_bearings.length() { side_bearings[i] } else { 0 })
  }
  for i in metrics..<glyph_count {
    writer.i16(if i < side_bearings.length() { side_bearings[i] } else { 0 })
  }
  writer.to_bytes()
}
