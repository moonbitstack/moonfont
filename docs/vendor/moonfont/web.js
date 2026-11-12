function $oob() {
  throw new Error("Index out of bounds");
}
class $PanicError extends Error {}
function $panic(message) {
  throw new $PanicError(message);
}
function _M0TPB13StringBuilder(param0) {
  this.val = param0;
}
function _M0TPC16string10StringView(param0, param1, param2) {
  this.str = param0;
  this.start = param1;
  this.end = param2;
}
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
function $makebytes(a, b) {
  const arr = new Uint8Array(a);
  if (b !== 0) {
    arr.fill(b);
  }
  return arr;
}
function _M0TPC15bytes9BytesView(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TPB9ArrayViewGsE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TP312moonbitstack8moonfont5model7GlyphId(param0) {
  this.index = param0;
}
function _M0TP312moonbitstack8moonfont5model5Point(param0, param1) {
  this.x = param0;
  this.y = param1;
}
function _M0TP312moonbitstack8moonfont5model6Bounds(param0, param1, param2, param3) {
  this.x_min = param0;
  this.y_min = param1;
  this.x_max = param2;
  this.y_max = param3;
}
function _M0TP312moonbitstack8moonfont5model7Outline(param0, param1) {
  this.commands = param0;
  this.bounds = param1;
}
function _M0TP312moonbitstack8moonfont5model12CoverageMask(param0, param1, param2, param3, param4) {
  this.width = param0;
  this.height = param1;
  this.left = param2;
  this.top = param3;
  this.samples = param4;
}
function _M0TP312moonbitstack8moonfont5model5Scale(param0, param1) {
  this.ppem = param0;
  this.units_per_em = param1;
}
function _M0TP312moonbitstack8moonfont5model6Limits(param0, param1, param2, param3, param4, param5, param6, param7) {
  this.file_bytes = param0;
  this.table_bytes = param1;
  this.glyphs = param2;
  this.points = param3;
  this.contours = param4;
  this.composites = param5;
  this.recursion = param6;
  this.mask_pixels = param7;
}
function _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0DTPC15error5Error51moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnknown(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error51moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnknown.prototype.$tag = 8;
function _M0DTPC15error5Error54moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnexpected(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTPC15error5Error54moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnexpected.prototype.$tag = 7;
function _M0DTPC15error5Error55moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnsupported(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error55moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnsupported.prototype.$tag = 6;
function _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eTruncated(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eTruncated.prototype.$tag = 5;
function _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eOverLimit(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eOverLimit.prototype.$tag = 4;
function _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed.prototype.$tag = 3;
function _M0DTPC15error5Error56moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMissingTable(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error56moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMissingTable.prototype.$tag = 2;
function _M0DTPC15error5Error56moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMissingGlyph(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error56moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMissingGlyph.prototype.$tag = 1;
function _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eRecursion(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eRecursion.prototype.$tag = 0;
function _M0TP312moonbitstack8moonfont4wire6Cursor(param0, param1) {
  this.data = param0;
  this.pos = param1;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont4wire6CursorRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont4wire6CursorRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont4wire6CursorRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont4wire6CursorRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HeadRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HeadRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HeadRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HeadRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP312moonbitstack8moonfont5table4Head(param0, param1, param2, param3, param4) {
  this.units_per_em = param0;
  this.index_to_loc_format = param1;
  this.mac_style = param2;
  this.lowest_rec_ppem = param3;
  this.bounding_box = param4;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HheaRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HheaRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HheaRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HheaRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP312moonbitstack8moonfont5table4Hhea(param0, param1, param2, param3) {
  this.ascender = param0;
  this.descender = param1;
  this.line_gap = param2;
  this.number_of_h_metrics = param3;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4MaxpRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4MaxpRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4MaxpRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4MaxpRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP312moonbitstack8moonfont5table4Maxp(param0, param1, param2, param3, param4) {
  this.num_glyphs = param0;
  this.max_points = param1;
  this.max_contours = param2;
  this.max_composite_points = param3;
  this.max_composite_contours = param4;
}
function _M0TPB5ArrayGiE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HmtxRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HmtxRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HmtxRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HmtxRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP312moonbitstack8moonfont5table4Hmtx(param0, param1) {
  this.advances = param0;
  this.bearings = param1;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4LocaRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4LocaRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4LocaRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4LocaRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP312moonbitstack8moonfont5table4Loca(param0) {
  this.offsets = param0;
}
function _M0TP312moonbitstack8moonfont5table3Os2(param0, param1, param2, param3, param4, param5, param6) {
  this.weight_class = param0;
  this.width_class = param1;
  this.x_height = param2;
  this.cap_height = param3;
  this.typo_ascender = param4;
  this.typo_descender = param5;
  this.typo_line_gap = param6;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table3Os2RP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table3Os2RP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table3Os2RP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table3Os2RP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TPB8MutLocalGiE(param0) {
  this.val = param0;
}
function _M0TP312moonbitstack8moonfont5table4Kern(param0) {
  this.pairs = param0;
}
function _M0TPB5ArrayGUiiiEE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4KernRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4KernRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4KernRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4KernRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRPB5ArrayGiERP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGiERP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGiERP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGiERP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TPB5ArrayGRP312moonbitstack8moonfont5table9ComponentE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TPB8MutLocalGbE(param0) {
  this.val = param0;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table14CompositeGlyphRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table14CompositeGlyphRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table14CompositeGlyphRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table14CompositeGlyphRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP312moonbitstack8moonfont5table9Component(param0, param1, param2, param3, param4, param5, param6) {
  this.glyph_index = param0;
  this.dx = param1;
  this.dy = param2;
  this.a = param3;
  this.b = param4;
  this.c = param5;
  this.d = param6;
}
function _M0TP312moonbitstack8moonfont5table14CompositeGlyph(param0, param1) {
  this.components = param0;
  this.bounds = param1;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0DTP312moonbitstack8moonfont5table9GlyphData5Empty() {}
_M0DTP312moonbitstack8moonfont5table9GlyphData5Empty.prototype.$tag = 0;
const _M0DTP312moonbitstack8moonfont5table9GlyphData5Empty__ = new _M0DTP312moonbitstack8moonfont5table9GlyphData5Empty();
function _M0DTP312moonbitstack8moonfont5table9GlyphData6Simple(param0) {
  this._0 = param0;
}
_M0DTP312moonbitstack8moonfont5table9GlyphData6Simple.prototype.$tag = 1;
function _M0DTP312moonbitstack8moonfont5table9GlyphData9Composite(param0) {
  this._0 = param0;
}
_M0DTP312moonbitstack8moonfont5table9GlyphData9Composite.prototype.$tag = 2;
function _M0TPB5ArrayGRP312moonbitstack8moonfont5model5PointE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TPB5ArrayGbE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TP312moonbitstack8moonfont5table11SimpleGlyph(param0, param1, param2, param3) {
  this.end_points = param0;
  this.points = param1;
  this.on_curve = param2;
  this.bounds = param3;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP312moonbitstack8moonfont5table4Cmap(param0, param1, param2) {
  this.data = param0;
  this.chosen = param1;
  this.format = param2;
}
function _M0TPB8MutLocalGRP312moonbitstack8moonfont5model5PointE(param0) {
  this.val = param0;
}
function _M0DTP312moonbitstack8moonfont5model11PathCommand6MoveTo(param0) {
  this._0 = param0;
}
_M0DTP312moonbitstack8moonfont5model11PathCommand6MoveTo.prototype.$tag = 0;
function _M0DTP312moonbitstack8moonfont5model11PathCommand6LineTo(param0) {
  this._0 = param0;
}
_M0DTP312moonbitstack8moonfont5model11PathCommand6LineTo.prototype.$tag = 1;
function _M0DTP312moonbitstack8moonfont5model11PathCommand6QuadTo(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP312moonbitstack8moonfont5model11PathCommand6QuadTo.prototype.$tag = 2;
function _M0DTP312moonbitstack8moonfont5model11PathCommand7CubicTo(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTP312moonbitstack8moonfont5model11PathCommand7CubicTo.prototype.$tag = 3;
function _M0DTP312moonbitstack8moonfont5model11PathCommand5Close() {}
_M0DTP312moonbitstack8moonfont5model11PathCommand5Close.prototype.$tag = 4;
const _M0DTP312moonbitstack8moonfont5model11PathCommand5Close__ = new _M0DTP312moonbitstack8moonfont5model11PathCommand5Close();
function _M0TPB8MutLocalGORP312moonbitstack8moonfont5model5PointE(param0) {
  this.val = param0;
}
function _M0TPB5ArrayGRP312moonbitstack8moonfont5model11PathCommandE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TP312moonbitstack8moonfont7outline11GlyphSource(param0, param1, param2) {
  this.glyf = param0;
  this.loca = param1;
  this.limits = param2;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP312moonbitstack8moonfont6raster4Edge(param0, param1, param2, param3, param4) {
  this.x0 = param0;
  this.y0 = param1;
  this.x1 = param2;
  this.y1 = param3;
  this.dir = param4;
}
function _M0TPB8MutLocalGlE(param0) {
  this.val = param0;
}
function _M0TPB5ArrayGRP312moonbitstack8moonfont6raster4EdgeE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TPB8MutLocalGUllEE(param0) {
  this.val = param0;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model12CoverageMaskRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5model12CoverageMaskRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model12CoverageMaskRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont5model12CoverageMaskRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function $make_array_len_and_init(a, b) {
  const arr = new Array(a);
  arr.fill(b);
  return arr;
}
function _M0TPB5ArrayGlE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt11TableRecordRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt11TableRecordRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt11TableRecordRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt11TableRecordRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt9DirectoryRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt9DirectoryRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt9DirectoryRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt9DirectoryRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TPB5ArrayGRP312moonbitstack8moonfont4sfnt11TableRecordE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TP312moonbitstack8moonfont4sfnt11TableRecord(param0, param1, param2, param3) {
  this.tag = param0;
  this.checksum = param1;
  this.offset = param2;
  this.length = param3;
}
function _M0TP312moonbitstack8moonfont4sfnt9Directory(param0, param1) {
  this.scaler = param0;
  this.records = param1;
}
function _M0DTPC16result6ResultGRPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryERP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryERP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryERP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryERP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0DTPC16result6ResultGRP212moonbitstack8moonfont4FaceRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP212moonbitstack8moonfont4FaceRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP212moonbitstack8moonfont4FaceRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP212moonbitstack8moonfont4FaceRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
function _M0TP212moonbitstack8moonfont4Face(param0, param1, param2, param3, param4, param5, param6, param7, param8) {
  this.head = param0;
  this.hhea = param1;
  this.maxp = param2;
  this.hmtx = param3;
  this.cmap = param4;
  this.kern = param5;
  this.os2 = param6;
  this.source = param7;
  this.limits = param8;
}
function _M0TP312moonbitstack8moonfont5model11FontMetrics(param0, param1, param2, param3, param4, param5, param6, param7) {
  this.units_per_em = param0;
  this.ascent = param1;
  this.descent = param2;
  this.line_gap = param3;
  this.cap_height = param4;
  this.x_height = param5;
  this.num_glyphs = param6;
  this.bounding_box = param7;
}
function _M0TPB5ArrayGsE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0DTPC16result6ResultGsRP312moonbitstack8moonfont5model7RefusedE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRP312moonbitstack8moonfont5model7RefusedE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGsRP312moonbitstack8moonfont5model7RefusedE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRP312moonbitstack8moonfont5model7RefusedE2Ok.prototype.$tag = 1;
const _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger = { method_0: _M0IPB13StringBuilderPB6Logger13write__string, method_1: _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE, method_2: _M0IPB13StringBuilderPB6Logger11write__view, method_3: _M0IPB13StringBuilderPB6Logger11write__char, method_4: _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE, method_5: _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE };
function _M0MPC15array5Array6bufferGlE(self) {
  return self.buf;
}
function _M0MPC15array5Array6bufferGiE(self) {
  return self.buf;
}
function _M0MPC15array5Array6bufferGbE(self) {
  return self.buf;
}
function _M0MPB18UninitializedArray6lengthGlE(self) {
  return self.length;
}
function _M0MPB18UninitializedArray6lengthGiE(self) {
  return self.length;
}
function _M0MPB18UninitializedArray6lengthGbE(self) {
  return self.length;
}
function _M0FPB13clamp__offset(offset, len) {
  return offset < 0 ? 0 : offset > len ? len : offset;
}
function _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGRP312moonbitstack8moonfont4sfnt9DirectoryEE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const _tmp$2 = dst_offset + i | 0;
        const _tmp$3 = src_offset + i | 0;
        if (_tmp$2 >>> 0 < dst.length) {
          dst[_tmp$2] = _tmp$3 >>> 0 < src.length ? src[_tmp$3] : $oob();
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    let _tmp$2 = len > 0;
    while (true) {
      const i = _tmp;
      const _more = _tmp$2;
      if (_more) {
        const _tmp$3 = dst_offset + i | 0;
        const _tmp$4 = src_offset + i | 0;
        if (_tmp$3 >>> 0 < dst.length) {
          dst[_tmp$3] = _tmp$4 >>> 0 < src.length ? src[_tmp$4] : $oob();
        } else {
          $oob();
        }
        _tmp = i - 1 | 0;
        _tmp$2 = i > 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGiEE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const _tmp$2 = dst_offset + i | 0;
        const _tmp$3 = src_offset + i | 0;
        if (_tmp$2 >>> 0 < dst.length) {
          dst[_tmp$2] = _tmp$3 >>> 0 < src.length ? src[_tmp$3] : $oob();
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    let _tmp$2 = len > 0;
    while (true) {
      const i = _tmp;
      const _more = _tmp$2;
      if (_more) {
        const _tmp$3 = dst_offset + i | 0;
        const _tmp$4 = src_offset + i | 0;
        if (_tmp$3 >>> 0 < dst.length) {
          dst[_tmp$3] = _tmp$4 >>> 0 < src.length ? src[_tmp$4] : $oob();
        } else {
          $oob();
        }
        _tmp = i - 1 | 0;
        _tmp$2 = i > 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGbEE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const _tmp$2 = dst_offset + i | 0;
        const _tmp$3 = src_offset + i | 0;
        if (_tmp$2 >>> 0 < dst.length) {
          dst[_tmp$2] = _tmp$3 >>> 0 < src.length ? src[_tmp$3] : $oob();
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    let _tmp$2 = len > 0;
    while (true) {
      const i = _tmp;
      const _more = _tmp$2;
      if (_more) {
        const _tmp$3 = dst_offset + i | 0;
        const _tmp$4 = src_offset + i | 0;
        if (_tmp$3 >>> 0 < dst.length) {
          dst[_tmp$3] = _tmp$4 >>> 0 < src.length ? src[_tmp$4] : $oob();
        } else {
          $oob();
        }
        _tmp = i - 1 | 0;
        _tmp$2 = i > 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPB18UninitializedArray12unsafe__blitGlE(dst, dst_offset, src, src_offset, len) {
  _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGRP312moonbitstack8moonfont4sfnt9DirectoryEE(dst, dst_offset, src, src_offset, len);
}
function _M0MPB18UninitializedArray12unsafe__blitGiE(dst, dst_offset, src, src_offset, len) {
  _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGiEE(dst, dst_offset, src, src_offset, len);
}
function _M0MPB18UninitializedArray12unsafe__blitGbE(dst, dst_offset, src, src_offset, len) {
  _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGbEE(dst, dst_offset, src, src_offset, len);
}
function _M0MPB18UninitializedArray23unsafe__make__and__blitGlE(src, allocate_len, src_offset, dst_offset, blit_len) {
  const dst = new Array(allocate_len);
  _M0MPB18UninitializedArray12unsafe__blitGlE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0MPB18UninitializedArray23unsafe__make__and__blitGiE(src, allocate_len, src_offset, dst_offset, blit_len) {
  const dst = new Array(allocate_len);
  _M0MPB18UninitializedArray12unsafe__blitGiE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0MPB18UninitializedArray23unsafe__make__and__blitGbE(src, allocate_len, src_offset, dst_offset, blit_len) {
  const dst = new Array(allocate_len);
  _M0MPB18UninitializedArray12unsafe__blitGbE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0FPB11range__fits(offset, len, length) {
  return offset >= 0 && offset <= (length - len | 0);
}
function _M0MPB13StringBuilder13write__objectGiE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGiE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB18UninitializedArray23make__and__blit_2einnerGlE(src, allocate_len, len, src_offset, dst_offset) {
  if (allocate_len >= 0 && (len >= 0 && (_M0FPB11range__fits(src_offset, len, _M0MPB18UninitializedArray6lengthGlE(src)) && _M0FPB11range__fits(dst_offset, len, allocate_len)))) {
    return _M0MPB18UninitializedArray23unsafe__make__and__blitGlE(src, allocate_len, src_offset, dst_offset, len);
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(89);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "bounds check failed: allocate_len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, allocate_len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", dst_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, dst_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src.length = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, _M0MPB18UninitializedArray6lengthGlE(src));
    return $panic(_M0MPB13StringBuilder10to__string(_string_builder));
  }
}
function _M0MPB18UninitializedArray23make__and__blit_2einnerGiE(src, allocate_len, len, src_offset, dst_offset) {
  if (allocate_len >= 0 && (len >= 0 && (_M0FPB11range__fits(src_offset, len, _M0MPB18UninitializedArray6lengthGiE(src)) && _M0FPB11range__fits(dst_offset, len, allocate_len)))) {
    return _M0MPB18UninitializedArray23unsafe__make__and__blitGiE(src, allocate_len, src_offset, dst_offset, len);
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(89);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "bounds check failed: allocate_len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, allocate_len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", dst_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, dst_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src.length = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, _M0MPB18UninitializedArray6lengthGiE(src));
    return $panic(_M0MPB13StringBuilder10to__string(_string_builder));
  }
}
function _M0MPB18UninitializedArray23make__and__blit_2einnerGbE(src, allocate_len, len, src_offset, dst_offset) {
  if (allocate_len >= 0 && (len >= 0 && (_M0FPB11range__fits(src_offset, len, _M0MPB18UninitializedArray6lengthGbE(src)) && _M0FPB11range__fits(dst_offset, len, allocate_len)))) {
    return _M0MPB18UninitializedArray23unsafe__make__and__blitGbE(src, allocate_len, src_offset, dst_offset, len);
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(89);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "bounds check failed: allocate_len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, allocate_len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", dst_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, dst_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src.length = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, _M0MPB18UninitializedArray6lengthGbE(src));
    return $panic(_M0MPB13StringBuilder10to__string(_string_builder));
  }
}
function _M0MPB13StringBuilder21StringBuilder_2einner(size_hint) {
  return size_hint >= 0 ? new _M0TPB13StringBuilder("") : $panic("size_hint must be non-negative");
}
function _M0MPB13StringBuilder10to__string(self) {
  return self.val;
}
function _M0IPB13StringBuilderPB6Logger11write__char(self, ch) {
  self.val = `${self.val}${String.fromCodePoint(ch)}`;
}
function _M0IPB13StringBuilderPB6Logger13write__string(self, str) {
  self.val = `${self.val}${str}`;
}
function _M0MPC16uint166UInt1622is__leading__surrogate(self) {
  return self >= 55296 && self <= 56319;
}
function _M0MPC16uint166UInt1623is__trailing__surrogate(self) {
  return self >= 56320 && self <= 57343;
}
function _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPC16string6String21clamped__view_2einner(self, start, end) {
  const len = self.length;
  const lo = start <= 0 ? 0 : start >= len ? len : _M0MPC16uint166UInt1623is__trailing__surrogate(self.charCodeAt(start)) && _M0MPC16uint166UInt1622is__leading__surrogate(self.charCodeAt(start - 1 | 0)) ? start + 1 | 0 : start;
  let hi;
  if (end === undefined) {
    hi = len;
  } else {
    const _Some = end;
    const _e = _Some;
    hi = _e <= 0 ? 0 : _e >= len ? len : _M0MPC16uint166UInt1623is__trailing__surrogate(self.charCodeAt(_e)) && _M0MPC16uint166UInt1622is__leading__surrogate(self.charCodeAt(_e - 1 | 0)) ? _e - 1 | 0 : _e;
  }
  return lo >= hi ? new _M0TPC16string10StringView(self, lo, lo) : new _M0TPC16string10StringView(self, lo, hi);
}
function _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(self, value, start, len) {
  _M0IPB13StringBuilderPB6Logger11write__view(self, _M0MPC16string6String21clamped__view_2einner(value, start, start + len | 0));
}
function _M0IP016_24default__implPB4Show6outputGiE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC13int3IntPB4Show10to__string(self));
}
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
}
function _M0FPB22index__out__of__boundsGyE(len, index) {
  const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(60);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "index out of bounds: the len is from 0 to ");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder, len);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " but the index is ");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder, index);
  return $panic(_M0MPB13StringBuilder10to__string(_string_builder));
}
function _M0MPC16string10StringView9to__owned(self) {
  return self.str.substring(self.start, self.end);
}
function _M0IPB13StringBuilderPB6Logger11write__view(self, str) {
  self.val = `${self.val}${_M0MPC16string10StringView9to__owned(str)}`;
}
function _M0MPC15array5Array6lengthGlE(self) {
  return self.len;
}
function _M0MPC15array5Array6lengthGiE(self) {
  return self.len;
}
function _M0FPB23array__growth__capacity(current, len, required) {
  if (required < len) {
    $panic("Array capacity overflow");
  }
  const start = current === 0 ? 8 : current;
  let _tmp = start;
  while (true) {
    const space = _tmp;
    if (space < required) {
      const next = Math.imul(space, 2) | 0;
      if (next <= space) {
        return required;
      }
      _tmp = next;
      continue;
    } else {
      return space;
    }
  }
}
function _M0MPC15array5Array8capacityGlE(self) {
  return _M0MPC15array5Array6bufferGlE(self).length;
}
function _M0MPC15array5Array8capacityGiE(self) {
  return _M0MPC15array5Array6bufferGiE(self).length;
}
function _M0MPC15array5Array8capacityGbE(self) {
  return _M0MPC15array5Array6bufferGbE(self).length;
}
function _M0MPC15array5Array14resize__bufferGlE(self, new_capacity) {
  const old_buf = self.buf;
  self.buf = [];
  const len = self.len;
  const copy_len = len < new_capacity ? len : new_capacity;
  const new_buf = _M0MPB18UninitializedArray23make__and__blit_2einnerGlE(old_buf, new_capacity, copy_len, 0, 0);
  self.buf = new_buf;
}
function _M0MPC15array5Array14resize__bufferGiE(self, new_capacity) {
  const old_buf = self.buf;
  self.buf = [];
  const len = self.len;
  const copy_len = len < new_capacity ? len : new_capacity;
  const new_buf = _M0MPB18UninitializedArray23make__and__blit_2einnerGiE(old_buf, new_capacity, copy_len, 0, 0);
  self.buf = new_buf;
}
function _M0MPC15array5Array14resize__bufferGbE(self, new_capacity) {
  const old_buf = self.buf;
  self.buf = [];
  const len = self.len;
  const copy_len = len < new_capacity ? len : new_capacity;
  const new_buf = _M0MPB18UninitializedArray23make__and__blit_2einnerGbE(old_buf, new_capacity, copy_len, 0, 0);
  self.buf = new_buf;
}
function _M0MPC15array5Array7reallocGlE(self, required) {
  const old_cap = _M0MPC15array5Array8capacityGlE(self);
  const new_cap = _M0FPB23array__growth__capacity(old_cap, self.len, required);
  _M0MPC15array5Array14resize__bufferGlE(self, new_cap);
}
function _M0MPC15array5Array7reallocGiE(self, required) {
  const old_cap = _M0MPC15array5Array8capacityGiE(self);
  const new_cap = _M0FPB23array__growth__capacity(old_cap, self.len, required);
  _M0MPC15array5Array14resize__bufferGiE(self, new_cap);
}
function _M0MPC15array5Array7reallocGbE(self, required) {
  const old_cap = _M0MPC15array5Array8capacityGbE(self);
  const new_cap = _M0FPB23array__growth__capacity(old_cap, self.len, required);
  _M0MPC15array5Array14resize__bufferGbE(self, new_cap);
}
function _M0MPC15array5Array4pushGlE(self, value) {
  if (self.len === _M0MPC15array5Array6bufferGlE(self).length) {
    _M0MPC15array5Array7reallocGlE(self, self.len + 1 | 0);
  }
  const length = self.len;
  self.buf[length] = value;
  self.len = length + 1 | 0;
}
function _M0MPC15array5Array4pushGiE(self, value) {
  if (self.len === _M0MPC15array5Array6bufferGiE(self).length) {
    _M0MPC15array5Array7reallocGiE(self, self.len + 1 | 0);
  }
  const length = self.len;
  self.buf[length] = value;
  self.len = length + 1 | 0;
}
function _M0MPC15array5Array4pushGbE(self, value) {
  if (self.len === _M0MPC15array5Array6bufferGbE(self).length) {
    _M0MPC15array5Array7reallocGbE(self, self.len + 1 | 0);
  }
  const length = self.len;
  self.buf[length] = value;
  self.len = length + 1 | 0;
}
function _M0IPC16string6StringPB12ToStringView16to__string__view(self) {
  return new _M0TPC16string10StringView(self, 0, self.length);
}
function _M0FPB19join__string__viewsGsE(parts, separator) {
  if ((parts.end - parts.start | 0) === 0) {
    return "";
  } else {
    if ((parts.end - parts.start | 0) === 1) {
      const _one = parts.buf[parts.start];
      return _M0MPC16string10StringView9to__owned(_M0IPC16string6StringPB12ToStringView16to__string__view(_one));
    } else {
      const _first = parts.buf[parts.start];
      const _x_buf = parts.buf;
      const _x_start = 1 + parts.start | 0;
      const _x_end = parts.end;
      const separator$2 = _M0MPC16string10StringView9to__owned(separator);
      let result = _M0MPC16string10StringView9to__owned(_M0IPC16string6StringPB12ToStringView16to__string__view(_first));
      const _bind = _x_end - _x_start | 0;
      let _tmp = 0;
      while (true) {
        const _ = _tmp;
        if (_ < _bind) {
          const part = _x_buf[_x_start + _ | 0];
          result = `${result}${separator$2}`;
          result = `${result}${_M0MPC16string10StringView9to__owned(_M0IPC16string6StringPB12ToStringView16to__string__view(part))}`;
          _tmp = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      return result;
    }
  }
}
function _M0IPC13int3IntPB4Show10to__string(self) {
  return _M0MPC13int3Int18to__string_2einner(self, 10);
}
function _M0MPC15array9ArrayView4joinGsE(self, separator) {
  return _M0FPB19join__string__viewsGsE(self, separator);
}
function _M0MPC16option6Option10unwrap__orGRP312moonbitstack8moonfont5model6LimitsE(self, default_) {
  if (self === undefined) {
    return default_;
  } else {
    const _Some = self;
    const _t = _Some;
    return _t;
  }
}
function _M0MPC16option6Option10unwrap__orGiE(self, default_) {
  if (self === undefined) {
    return default_;
  } else {
    const _Some = self;
    const _t = _Some;
    return _t;
  }
}
function _M0MPC15bytes9BytesView6length(self) {
  return self.end - self.start | 0;
}
function _M0MPC15array5Array2atGlE(self, index) {
  const len = self.len;
  return index >= 0 && index < len ? _M0MPC15array5Array6bufferGlE(self)[index] : $panic();
}
function _M0MPC15array5Array2atGiE(self, index) {
  const len = self.len;
  return index >= 0 && index < len ? _M0MPC15array5Array6bufferGiE(self)[index] : $panic();
}
function _M0MPC15array5Array2atGbE(self, index) {
  const len = self.len;
  return index >= 0 && index < len ? _M0MPC15array5Array6bufferGbE(self)[index] : $panic();
}
function _M0MPC15bytes9BytesView2at(self, index) {
  return index >= 0 && index < (self.end - self.start | 0) ? self.buf[self.start + index | 0] : _M0FPB22index__out__of__boundsGyE(self.end - self.start | 0, index);
}
function _M0MPC15bytes9BytesView21clamped__view_2einner(self, start, end) {
  const len = self.end - self.start | 0;
  const lo = _M0FPB13clamp__offset(start, len);
  let hi;
  if (end === undefined) {
    hi = len;
  } else {
    const _Some = end;
    const _end = _Some;
    hi = _M0FPB13clamp__offset(_end, len);
  }
  const hi$2 = hi > lo ? hi : lo;
  return new _M0TPC15bytes9BytesView(self.buf, self.start + lo | 0, self.start + hi$2 | 0);
}
function _M0MPC15array5Array3setGlE(self, index, value) {
  const len = self.len;
  if (index >= 0 && index < len) {
    _M0MPC15array5Array6bufferGlE(self)[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15array5Array3setGiE(self, index, value) {
  const len = self.len;
  if (index >= 0 && index < len) {
    _M0MPC15array5Array6bufferGiE(self)[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15array5Array4joinGsE(self, separator) {
  return _M0MPC15array9ArrayView4joinGsE(new _M0TPB9ArrayViewGsE(self.buf, 0, self.len), separator);
}
function _M0MP312moonbitstack8moonfont5model7GlyphId2of(index) {
  return new _M0TP312moonbitstack8moonfont5model7GlyphId(index);
}
function _M0MP312moonbitstack8moonfont5model7GlyphId7to__int(self) {
  return self.index;
}
function _M0MP312moonbitstack8moonfont5model5Point2of(x, y) {
  return new _M0TP312moonbitstack8moonfont5model5Point(x, y);
}
function _M0MP312moonbitstack8moonfont5model6Bounds5empty() {
  return new _M0TP312moonbitstack8moonfont5model6Bounds(0, 0, 0, 0);
}
function _M0MP312moonbitstack8moonfont5model7Outline2of(commands, bounds) {
  return new _M0TP312moonbitstack8moonfont5model7Outline(commands, bounds);
}
function _M0MP312moonbitstack8moonfont5model7Outline8commands(self) {
  return self.commands;
}
function _M0MP312moonbitstack8moonfont5model12CoverageMask2of(width, height, left, top, samples) {
  return new _M0TP312moonbitstack8moonfont5model12CoverageMask(width, height, left, top, samples);
}
function _M0MP312moonbitstack8moonfont5model5Scale2of(pixels_per_em, units_per_em) {
  return new _M0TP312moonbitstack8moonfont5model5Scale(pixels_per_em << 6, units_per_em);
}
function _M0MP312moonbitstack8moonfont5model5Scale5apply(self, units) {
  if (self.units_per_em <= 0) {
    return 0;
  }
  const _tmp = BigInt.asUintN(64, BigInt(self.units_per_em));
  if (_tmp === 0n) {
    $panic();
  }
  return Number(BigInt.asIntN(32, BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt(units)) * BigInt.asUintN(64, BigInt(self.ppem)))) / BigInt.asIntN(64, _tmp)))) | 0;
}
function _M0MP312moonbitstack8moonfont5model6Limits7default() {
  return new _M0TP312moonbitstack8moonfont5model6Limits(268435456, 268435456, 65536, 65536, 8192, 1024, 16, 67108864);
}
function _M0FP312moonbitstack8moonfont5model4over(limit, got) {
  if (got > limit) {
    return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eOverLimit(limit, got));
  } else {
    return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE2Ok(undefined);
  }
}
function _M0MP312moonbitstack8moonfont5model6Limits11check__file(self, size) {
  return _M0FP312moonbitstack8moonfont5model4over(self.file_bytes, size);
}
function _M0MP312moonbitstack8moonfont5model6Limits12check__table(self, size) {
  return _M0FP312moonbitstack8moonfont5model4over(self.table_bytes, size);
}
function _M0MP312moonbitstack8moonfont5model6Limits13check__glyphs(self, count) {
  return _M0FP312moonbitstack8moonfont5model4over(self.glyphs, count);
}
function _M0MP312moonbitstack8moonfont5model6Limits14check__outline(self, points, contours) {
  const _bind = _M0FP312moonbitstack8moonfont5model4over(self.points, points);
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  return _M0FP312moonbitstack8moonfont5model4over(self.contours, contours);
}
function _M0MP312moonbitstack8moonfont5model6Limits17check__composites(self, count) {
  return _M0FP312moonbitstack8moonfont5model4over(self.composites, count);
}
function _M0MP312moonbitstack8moonfont5model6Limits12check__depth(self, depth) {
  if (depth > self.recursion) {
    return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eRecursion(depth));
  } else {
    return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE2Ok(undefined);
  }
}
function _M0MP312moonbitstack8moonfont5model6Limits11check__mask(self, width, height) {
  if (width <= 0 || height <= 0) {
    return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE2Ok(undefined);
  }
  const pixels = BigInt.asUintN(64, BigInt.asUintN(64, BigInt(width)) * BigInt.asUintN(64, BigInt(height)));
  if (BigInt.asIntN(64, pixels) > BigInt.asIntN(64, BigInt.asUintN(64, BigInt(self.mask_pixels)))) {
    return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eOverLimit(self.mask_pixels, Number(BigInt.asIntN(32, pixels)) | 0));
  } else {
    return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE2Ok(undefined);
  }
}
function _M0MP312moonbitstack8moonfont4wire6Cursor3new(data) {
  return new _M0TP312moonbitstack8moonfont4wire6Cursor(data, 0);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor8position(self) {
  return self.pos;
}
function _M0MP312moonbitstack8moonfont4wire6Cursor6length(self) {
  return _M0MPC15bytes9BytesView6length(self.data);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor4left(self) {
  return _M0MPC15bytes9BytesView6length(self.data) - self.pos | 0;
}
function _M0MP312moonbitstack8moonfont4wire6Cursor3all(self) {
  return self.data;
}
function _M0MP312moonbitstack8moonfont4wire6Cursor4seek(self, at) {
  if (at < 0 || at > _M0MPC15bytes9BytesView6length(self.data)) {
    return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eTruncated(at, 0));
  }
  self.pos = at;
  return new _M0DTPC16result6ResultGuRP312moonbitstack8moonfont5model7RefusedE2Ok(undefined);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor4skip(self, count) {
  return _M0MP312moonbitstack8moonfont4wire6Cursor4seek(self, self.pos + count | 0);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor6window(self, at, length) {
  if (at < 0 || (length < 0 || (at > _M0MP312moonbitstack8moonfont4wire6Cursor6length(self) || length > (_M0MP312moonbitstack8moonfont4wire6Cursor6length(self) - at | 0)))) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont4wire6CursorRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eTruncated(at, length));
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont4wire6CursorRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0MP312moonbitstack8moonfont4wire6Cursor3new(_M0MPC15bytes9BytesView21clamped__view_2einner(self.data, at, at + length | 0)));
}
function _M0MP312moonbitstack8moonfont4wire6Cursor2u8(self) {
  if (self.pos >= _M0MPC15bytes9BytesView6length(self.data)) {
    return new _M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eTruncated(self.pos, 1));
  }
  const value = _M0MPC15bytes9BytesView2at(self.data, self.pos);
  self.pos = self.pos + 1 | 0;
  return new _M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE2Ok(value);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor2i8(self) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor2u8(self);
  let value;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    value = _ok._0;
  } else {
    return _bind;
  }
  return new _M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE2Ok(value >= 128 ? value - 256 | 0 : value);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor3u16(self) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor2u8(self);
  let hi;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    hi = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor2u8(self);
  let lo;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    lo = _ok._0;
  } else {
    return _bind$2;
  }
  return new _M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE2Ok(hi << 8 | lo);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor3i16(self) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(self);
  let value;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    value = _ok._0;
  } else {
    return _bind;
  }
  return new _M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE2Ok(value >= 32768 ? value - 65536 | 0 : value);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor3u32(self) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(self);
  let hi;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    hi = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(self);
  let lo;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    lo = _ok._0;
  } else {
    return _bind$2;
  }
  return new _M0DTPC16result6ResultGiRP312moonbitstack8moonfont5model7RefusedE2Ok(hi << 16 | lo);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor3tag(self) {
  return _M0MP312moonbitstack8moonfont4wire6Cursor3u32(self);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor7u16__at(self, at) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor6window(self, at, 2);
  let other;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    other = _ok._0;
  } else {
    return _bind;
  }
  return _M0MP312moonbitstack8moonfont4wire6Cursor3u16(other);
}
function _M0MP312moonbitstack8moonfont4wire6Cursor7i16__at(self, at) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor6window(self, at, 2);
  let other;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    other = _ok._0;
  } else {
    return _bind;
  }
  return _M0MP312moonbitstack8moonfont4wire6Cursor3i16(other);
}
function _M0MP312moonbitstack8moonfont5table4Head5parse(cursor) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor4seek(cursor, 12);
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(cursor);
  let magic;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    magic = _ok._0;
  } else {
    return _bind$2;
  }
  if (magic !== 1594834165) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(11);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "head magic ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, magic);
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HeadRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error54moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnexpected(12, _M0MPB13StringBuilder10to__string(_string_builder), "0x5F0F3CF5"));
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor4seek(cursor, 18);
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    _ok._0;
  } else {
    return _bind$3;
  }
  const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let units_per_em;
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    units_per_em = _ok._0;
  } else {
    return _bind$4;
  }
  if (units_per_em < 16 || units_per_em > 16384) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(14);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "unitsPerEm of ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, units_per_em);
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HeadRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(18, _M0MPB13StringBuilder10to__string(_string_builder)));
  }
  const _bind$5 = _M0MP312moonbitstack8moonfont4wire6Cursor4seek(cursor, 36);
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    _ok._0;
  } else {
    return _bind$5;
  }
  const _bind$6 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let x_min;
  if (_bind$6.$tag === 1) {
    const _ok = _bind$6;
    x_min = _ok._0;
  } else {
    return _bind$6;
  }
  const _bind$7 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let y_min;
  if (_bind$7.$tag === 1) {
    const _ok = _bind$7;
    y_min = _ok._0;
  } else {
    return _bind$7;
  }
  const _bind$8 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let x_max;
  if (_bind$8.$tag === 1) {
    const _ok = _bind$8;
    x_max = _ok._0;
  } else {
    return _bind$8;
  }
  const _bind$9 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let y_max;
  if (_bind$9.$tag === 1) {
    const _ok = _bind$9;
    y_max = _ok._0;
  } else {
    return _bind$9;
  }
  const _bind$10 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let mac_style;
  if (_bind$10.$tag === 1) {
    const _ok = _bind$10;
    mac_style = _ok._0;
  } else {
    return _bind$10;
  }
  const _bind$11 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let lowest_rec_ppem;
  if (_bind$11.$tag === 1) {
    const _ok = _bind$11;
    lowest_rec_ppem = _ok._0;
  } else {
    return _bind$11;
  }
  const _bind$12 = _M0MP312moonbitstack8moonfont4wire6Cursor4seek(cursor, 50);
  if (_bind$12.$tag === 1) {
    const _ok = _bind$12;
    _ok._0;
  } else {
    return _bind$12;
  }
  const _bind$13 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let index_to_loc_format;
  if (_bind$13.$tag === 1) {
    const _ok = _bind$13;
    index_to_loc_format = _ok._0;
  } else {
    return _bind$13;
  }
  if (index_to_loc_format !== 0 && index_to_loc_format !== 1) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(20);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "indexToLocFormat of ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, index_to_loc_format);
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HeadRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(50, _M0MPB13StringBuilder10to__string(_string_builder)));
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HeadRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Head(units_per_em, index_to_loc_format, mac_style, lowest_rec_ppem, new _M0TP312moonbitstack8moonfont5model6Bounds(x_min, y_min, x_max, y_max)));
}
function _M0MP312moonbitstack8moonfont5table4Hhea5parse(cursor) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor4seek(cursor, 4);
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let ascender;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    ascender = _ok._0;
  } else {
    return _bind$2;
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let descender;
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    descender = _ok._0;
  } else {
    return _bind$3;
  }
  const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let line_gap;
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    line_gap = _ok._0;
  } else {
    return _bind$4;
  }
  const _bind$5 = _M0MP312moonbitstack8moonfont4wire6Cursor4seek(cursor, 34);
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    _ok._0;
  } else {
    return _bind$5;
  }
  const _bind$6 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let number_of_h_metrics;
  if (_bind$6.$tag === 1) {
    const _ok = _bind$6;
    number_of_h_metrics = _ok._0;
  } else {
    return _bind$6;
  }
  if (number_of_h_metrics <= 0) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HheaRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(34, "zero horizontal metrics"));
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HheaRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Hhea(ascender, descender, line_gap, number_of_h_metrics));
}
function _M0MP312moonbitstack8moonfont5table4Maxp5parse(cursor, limits) {
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor4seek(cursor, 0);
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(cursor);
  let version;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    version = _ok._0;
  } else {
    return _bind$2;
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let num_glyphs;
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    num_glyphs = _ok._0;
  } else {
    return _bind$3;
  }
  const _bind$4 = _M0MP312moonbitstack8moonfont5model6Limits13check__glyphs(limits, num_glyphs);
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    _ok._0;
  } else {
    return _bind$4;
  }
  if (version === 20480) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4MaxpRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Maxp(num_glyphs, 0, 0, 0, 0));
  }
  if (version !== 65536) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(13);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "maxp version ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, version);
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4MaxpRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error55moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnsupported(0, _M0MPB13StringBuilder10to__string(_string_builder)));
  }
  const _bind$5 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let max_points;
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    max_points = _ok._0;
  } else {
    return _bind$5;
  }
  const _bind$6 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let max_contours;
  if (_bind$6.$tag === 1) {
    const _ok = _bind$6;
    max_contours = _ok._0;
  } else {
    return _bind$6;
  }
  const _bind$7 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let max_composite_points;
  if (_bind$7.$tag === 1) {
    const _ok = _bind$7;
    max_composite_points = _ok._0;
  } else {
    return _bind$7;
  }
  const _bind$8 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let max_composite_contours;
  if (_bind$8.$tag === 1) {
    const _ok = _bind$8;
    max_composite_contours = _ok._0;
  } else {
    return _bind$8;
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4MaxpRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Maxp(num_glyphs, max_points, max_contours, max_composite_points, max_composite_contours));
}
function _M0MP312moonbitstack8moonfont5table4Hmtx5parse(cursor, num_glyphs, number_of_h_metrics, limits) {
  const _bind = _M0MP312moonbitstack8moonfont5model6Limits13check__glyphs(limits, num_glyphs);
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  const count = number_of_h_metrics > num_glyphs ? num_glyphs : number_of_h_metrics;
  const advances = new _M0TPB5ArrayGiE([], 0);
  const bearings = new _M0TPB5ArrayGiE([], 0);
  const _bind$2 = 0;
  let _tmp = _bind$2;
  while (true) {
    const _ = _tmp;
    if (_ < count) {
      const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
      let _tmp$2;
      if (_bind$3.$tag === 1) {
        const _ok = _bind$3;
        _tmp$2 = _ok._0;
      } else {
        return _bind$3;
      }
      _M0MPC15array5Array4pushGiE(advances, _tmp$2);
      const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
      let _tmp$3;
      if (_bind$4.$tag === 1) {
        const _ok = _bind$4;
        _tmp$3 = _ok._0;
      } else {
        return _bind$4;
      }
      _M0MPC15array5Array4pushGiE(bearings, _tmp$3);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  let _tmp$2 = count;
  while (true) {
    const _ = _tmp$2;
    if (_ < num_glyphs) {
      _M0MPC15array5Array4pushGiE(advances, _M0MPC15array5Array2atGiE(advances, count - 1 | 0));
      const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
      let _tmp$3;
      if (_bind$3.$tag === 1) {
        const _ok = _bind$3;
        _tmp$3 = _ok._0;
      } else {
        return _bind$3;
      }
      _M0MPC15array5Array4pushGiE(bearings, _tmp$3);
      _tmp$2 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4HmtxRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Hmtx(advances, bearings));
}
function _M0MP312moonbitstack8moonfont5table4Loca5parse(cursor, num_glyphs, index_to_loc_format, limits) {
  const _bind = _M0MP312moonbitstack8moonfont5model6Limits13check__glyphs(limits, num_glyphs);
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  const offsets = new _M0TPB5ArrayGiE([], 0);
  const _bind$2 = 0;
  const _bind$3 = num_glyphs + 1 | 0;
  let _tmp = _bind$2;
  while (true) {
    const _ = _tmp;
    if (_ < _bind$3) {
      let value;
      if (index_to_loc_format === 0) {
        const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
        let _tmp$2;
        if (_bind$4.$tag === 1) {
          const _ok = _bind$4;
          _tmp$2 = _ok._0;
        } else {
          return _bind$4;
        }
        value = Math.imul(_tmp$2, 2) | 0;
      } else {
        const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(cursor);
        if (_bind$4.$tag === 1) {
          const _ok = _bind$4;
          value = _ok._0;
        } else {
          return _bind$4;
        }
      }
      if (value < 0 || _M0MPC15array5Array6lengthGiE(offsets) > 0 && value < _M0MPC15array5Array2atGiE(offsets, _M0MPC15array5Array6lengthGiE(offsets) - 1 | 0)) {
        return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4LocaRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(_M0MP312moonbitstack8moonfont4wire6Cursor8position(cursor), "a loca offset going backwards"));
      }
      _M0MPC15array5Array4pushGiE(offsets, value);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4LocaRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Loca(offsets));
}
function _M0MP312moonbitstack8moonfont5table4Loca5range(self, glyph) {
  return glyph < 0 || (glyph + 1 | 0) >= _M0MPC15array5Array6lengthGiE(self.offsets) ? undefined : { _0: _M0MPC15array5Array2atGiE(self.offsets, glyph), _1: _M0MPC15array5Array2atGiE(self.offsets, glyph + 1 | 0) };
}
function _M0MP312moonbitstack8moonfont5table3Os25empty() {
  return new _M0TP312moonbitstack8moonfont5table3Os2(400, 5, 0, 0, 0, 0, 0);
}
function _M0MP312moonbitstack8moonfont5table3Os25parse(cursor) {
  if (_M0MP312moonbitstack8moonfont4wire6Cursor6length(cursor) < 78) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table3Os2RP312moonbitstack8moonfont5model7RefusedE2Ok(_M0MP312moonbitstack8moonfont5table3Os25empty());
  }
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let version;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    version = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor7u16__at(cursor, 4);
  let weight_class;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    weight_class = _ok._0;
  } else {
    return _bind$2;
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor7u16__at(cursor, 6);
  let width_class;
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    width_class = _ok._0;
  } else {
    return _bind$3;
  }
  const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor7i16__at(cursor, 68);
  let typo_ascender;
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    typo_ascender = _ok._0;
  } else {
    return _bind$4;
  }
  const _bind$5 = _M0MP312moonbitstack8moonfont4wire6Cursor7i16__at(cursor, 70);
  let typo_descender;
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    typo_descender = _ok._0;
  } else {
    return _bind$5;
  }
  const _bind$6 = _M0MP312moonbitstack8moonfont4wire6Cursor7i16__at(cursor, 72);
  let typo_line_gap;
  if (_bind$6.$tag === 1) {
    const _ok = _bind$6;
    typo_line_gap = _ok._0;
  } else {
    return _bind$6;
  }
  const x_height = new _M0TPB8MutLocalGiE(0);
  const cap_height = new _M0TPB8MutLocalGiE(0);
  if (version >= 2 && _M0MP312moonbitstack8moonfont4wire6Cursor6length(cursor) >= 90) {
    const _bind$7 = _M0MP312moonbitstack8moonfont4wire6Cursor7i16__at(cursor, 86);
    let _tmp;
    if (_bind$7.$tag === 1) {
      const _ok = _bind$7;
      _tmp = _ok._0;
    } else {
      return _bind$7;
    }
    x_height.val = _tmp;
    const _bind$8 = _M0MP312moonbitstack8moonfont4wire6Cursor7i16__at(cursor, 88);
    let _tmp$2;
    if (_bind$8.$tag === 1) {
      const _ok = _bind$8;
      _tmp$2 = _ok._0;
    } else {
      return _bind$8;
    }
    cap_height.val = _tmp$2;
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table3Os2RP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table3Os2(weight_class, width_class, x_height.val, cap_height.val, typo_ascender, typo_descender, typo_line_gap));
}
function _M0MP312moonbitstack8moonfont5table4Kern5empty() {
  return new _M0TP312moonbitstack8moonfont5table4Kern(new _M0TPB5ArrayGUiiiEE([], 0));
}
function _M0MP312moonbitstack8moonfont5table4Kern5parse(cursor, limits) {
  const pairs = new _M0TPB5ArrayGUiiiEE([], 0);
  if (_M0MP312moonbitstack8moonfont4wire6Cursor6length(cursor) < 4) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4KernRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Kern(pairs));
  }
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let version;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    version = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let subtables;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    subtables = _ok._0;
  } else {
    return _bind$2;
  }
  if (version !== 0 || subtables === 0) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4KernRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Kern(pairs));
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor4skip(cursor, 2);
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    _ok._0;
  } else {
    return _bind$3;
  }
  const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let length;
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    length = _ok._0;
  } else {
    return _bind$4;
  }
  const _bind$5 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let coverage;
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    coverage = _ok._0;
  } else {
    return _bind$5;
  }
  const format = coverage >> 8;
  if (format === 0 && length >= 14) {
    const _bind$6 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
    let count;
    if (_bind$6.$tag === 1) {
      const _ok = _bind$6;
      count = _ok._0;
    } else {
      return _bind$6;
    }
    const _bind$7 = _M0MP312moonbitstack8moonfont4wire6Cursor4skip(cursor, 6);
    if (_bind$7.$tag === 1) {
      const _ok = _bind$7;
      _ok._0;
    } else {
      return _bind$7;
    }
    const _bind$8 = _M0MP312moonbitstack8moonfont5model6Limits14check__outline(limits, count, 0);
    if (_bind$8.$tag === 1) {
      const _ok = _bind$8;
      _ok._0;
    } else {
      return _bind$8;
    }
    const _bind$9 = 0;
    let _tmp = _bind$9;
    while (true) {
      const _ = _tmp;
      if (_ < count) {
        const _bind$10 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
        let left;
        if (_bind$10.$tag === 1) {
          const _ok = _bind$10;
          left = _ok._0;
        } else {
          return _bind$10;
        }
        const _bind$11 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
        let right;
        if (_bind$11.$tag === 1) {
          const _ok = _bind$11;
          right = _ok._0;
        } else {
          return _bind$11;
        }
        const _bind$12 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
        let value;
        if (_bind$12.$tag === 1) {
          const _ok = _bind$12;
          value = _ok._0;
        } else {
          return _bind$12;
        }
        _M0MPC15array5Array4pushGlE(pairs, { _0: left, _1: right, _2: value });
        _tmp = _ + 1 | 0;
        continue;
      } else {
        break;
      }
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4KernRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Kern(pairs));
}
function _M0FP312moonbitstack8moonfont5table11read__flags(cursor, count) {
  const flags = new _M0TPB5ArrayGiE([], 0);
  while (true) {
    if (_M0MPC15array5Array6lengthGiE(flags) < count) {
      const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor2u8(cursor);
      let flag;
      if (_bind.$tag === 1) {
        const _ok = _bind;
        flag = _ok._0;
      } else {
        return _bind;
      }
      _M0MPC15array5Array4pushGiE(flags, flag);
      if ((flag & 8) !== 0) {
        const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor2u8(cursor);
        let repeats;
        if (_bind$2.$tag === 1) {
          const _ok = _bind$2;
          repeats = _ok._0;
        } else {
          return _bind$2;
        }
        if ((_M0MPC15array5Array6lengthGiE(flags) + repeats | 0) > count) {
          return new _M0DTPC16result6ResultGRPB5ArrayGiERP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(_M0MP312moonbitstack8moonfont4wire6Cursor8position(cursor), "a repeat flag past the declared point count"));
        }
        const _bind$3 = 0;
        let _tmp = _bind$3;
        while (true) {
          const _ = _tmp;
          if (_ < repeats) {
            _M0MPC15array5Array4pushGiE(flags, flag);
            _tmp = _ + 1 | 0;
            continue;
          } else {
            break;
          }
        }
      }
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGiERP312moonbitstack8moonfont5model7RefusedE2Ok(flags);
}
function _M0FP312moonbitstack8moonfont5table12read__coords(cursor, flags, x_axis) {
  const short_bit = x_axis ? 2 : 4;
  const same_bit = x_axis ? 16 : 32;
  const values = new _M0TPB5ArrayGiE([], 0);
  const value = new _M0TPB8MutLocalGiE(0);
  const _bind = 0;
  const _bind$2 = _M0MPC15array5Array6lengthGiE(flags);
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      const flag = _M0MPC15array5Array2atGiE(flags, i);
      if ((flag & short_bit) !== 0) {
        const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor2u8(cursor);
        let delta;
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          delta = _ok._0;
        } else {
          return _bind$3;
        }
        if ((flag & same_bit) !== 0) {
          value.val = value.val + delta | 0;
        } else {
          value.val = value.val - delta | 0;
        }
      } else {
        if ((flag & same_bit) === 0) {
          const _tmp$2 = value.val;
          const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
          let _tmp$3;
          if (_bind$3.$tag === 1) {
            const _ok = _bind$3;
            _tmp$3 = _ok._0;
          } else {
            return _bind$3;
          }
          value.val = _tmp$2 + _tmp$3 | 0;
        }
      }
      _M0MPC15array5Array4pushGiE(values, value.val);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGiERP312moonbitstack8moonfont5model7RefusedE2Ok(values);
}
function _M0FP312moonbitstack8moonfont5table16parse__composite(cursor, bounds, limits) {
  const components = new _M0TPB5ArrayGRP312moonbitstack8moonfont5table9ComponentE([], 0);
  const more = new _M0TPB8MutLocalGbE(true);
  const last_flags = new _M0TPB8MutLocalGiE(0);
  while (true) {
    if (more.val) {
      const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
      let flags;
      if (_bind.$tag === 1) {
        const _ok = _bind;
        flags = _ok._0;
      } else {
        return _bind;
      }
      last_flags.val = flags;
      const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
      let glyph_index;
      if (_bind$2.$tag === 1) {
        const _ok = _bind$2;
        glyph_index = _ok._0;
      } else {
        return _bind$2;
      }
      const has_words = (flags & 1) !== 0;
      const is_xy = (flags & 2) !== 0;
      let arg1;
      if (has_words) {
        const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          arg1 = _ok._0;
        } else {
          return _bind$3;
        }
      } else {
        const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor2i8(cursor);
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          arg1 = _ok._0;
        } else {
          return _bind$3;
        }
      }
      let arg2;
      if (has_words) {
        const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          arg2 = _ok._0;
        } else {
          return _bind$3;
        }
      } else {
        const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor2i8(cursor);
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          arg2 = _ok._0;
        } else {
          return _bind$3;
        }
      }
      if (is_xy) {
      } else {
        return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table14CompositeGlyphRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error55moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnsupported(_M0MP312moonbitstack8moonfont4wire6Cursor8position(cursor), "point-matching composite components"));
      }
      const a = new _M0TPB8MutLocalGiE(16384);
      const b = new _M0TPB8MutLocalGiE(0);
      const c = new _M0TPB8MutLocalGiE(0);
      const d = new _M0TPB8MutLocalGiE(16384);
      if ((flags & 8) !== 0) {
        const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
        let _tmp;
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          _tmp = _ok._0;
        } else {
          return _bind$3;
        }
        a.val = _tmp;
        d.val = a.val;
      } else {
        if ((flags & 64) !== 0) {
          const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
          let _tmp;
          if (_bind$3.$tag === 1) {
            const _ok = _bind$3;
            _tmp = _ok._0;
          } else {
            return _bind$3;
          }
          a.val = _tmp;
          const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
          let _tmp$2;
          if (_bind$4.$tag === 1) {
            const _ok = _bind$4;
            _tmp$2 = _ok._0;
          } else {
            return _bind$4;
          }
          d.val = _tmp$2;
        } else {
          if ((flags & 128) !== 0) {
            const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
            let _tmp;
            if (_bind$3.$tag === 1) {
              const _ok = _bind$3;
              _tmp = _ok._0;
            } else {
              return _bind$3;
            }
            a.val = _tmp;
            const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
            let _tmp$2;
            if (_bind$4.$tag === 1) {
              const _ok = _bind$4;
              _tmp$2 = _ok._0;
            } else {
              return _bind$4;
            }
            b.val = _tmp$2;
            const _bind$5 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
            let _tmp$3;
            if (_bind$5.$tag === 1) {
              const _ok = _bind$5;
              _tmp$3 = _ok._0;
            } else {
              return _bind$5;
            }
            c.val = _tmp$3;
            const _bind$6 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
            let _tmp$4;
            if (_bind$6.$tag === 1) {
              const _ok = _bind$6;
              _tmp$4 = _ok._0;
            } else {
              return _bind$6;
            }
            d.val = _tmp$4;
          }
        }
      }
      _M0MPC15array5Array4pushGlE(components, new _M0TP312moonbitstack8moonfont5table9Component(glyph_index, arg1, arg2, a.val, b.val, c.val, d.val));
      const _bind$3 = _M0MP312moonbitstack8moonfont5model6Limits17check__composites(limits, _M0MPC15array5Array6lengthGlE(components));
      if (_bind$3.$tag === 1) {
        const _ok = _bind$3;
        _ok._0;
      } else {
        return _bind$3;
      }
      more.val = (flags & 32) !== 0;
      continue;
    } else {
      break;
    }
  }
  if ((last_flags.val & 256) !== 0) {
    const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
    let instructions;
    if (_bind.$tag === 1) {
      const _ok = _bind;
      instructions = _ok._0;
    } else {
      return _bind;
    }
    const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor4skip(cursor, instructions);
    if (_bind$2.$tag === 1) {
      const _ok = _bind$2;
      _ok._0;
    } else {
      return _bind$2;
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table14CompositeGlyphRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table14CompositeGlyph(components, bounds));
}
function _M0MP312moonbitstack8moonfont5table9GlyphData5parse(view, limits) {
  if (_M0MPC15bytes9BytesView6length(view) === 0) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0DTP312moonbitstack8moonfont5table9GlyphData5Empty__);
  }
  const cursor = _M0MP312moonbitstack8moonfont4wire6Cursor3new(view);
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let contours;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    contours = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let x_min;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    x_min = _ok._0;
  } else {
    return _bind$2;
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let y_min;
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    y_min = _ok._0;
  } else {
    return _bind$3;
  }
  const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let x_max;
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    x_max = _ok._0;
  } else {
    return _bind$4;
  }
  const _bind$5 = _M0MP312moonbitstack8moonfont4wire6Cursor3i16(cursor);
  let y_max;
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    y_max = _ok._0;
  } else {
    return _bind$5;
  }
  const bounds = new _M0TP312moonbitstack8moonfont5model6Bounds(x_min, y_min, x_max, y_max);
  if (contours === 0) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0DTP312moonbitstack8moonfont5table9GlyphData5Empty__);
  }
  if (contours < 0) {
    const _bind$6 = _M0FP312moonbitstack8moonfont5table16parse__composite(cursor, bounds, limits);
    let _tmp;
    if (_bind$6.$tag === 1) {
      const _ok = _bind$6;
      _tmp = _ok._0;
    } else {
      return _bind$6;
    }
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0DTP312moonbitstack8moonfont5table9GlyphData9Composite(_tmp));
  }
  const _bind$6 = _M0MP312moonbitstack8moonfont5model6Limits14check__outline(limits, 0, contours);
  if (_bind$6.$tag === 1) {
    const _ok = _bind$6;
    _ok._0;
  } else {
    return _bind$6;
  }
  const end_points = new _M0TPB5ArrayGiE([], 0);
  const _bind$7 = 0;
  let _tmp = _bind$7;
  while (true) {
    const _ = _tmp;
    if (_ < contours) {
      const _bind$8 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
      let _tmp$2;
      if (_bind$8.$tag === 1) {
        const _ok = _bind$8;
        _tmp$2 = _ok._0;
      } else {
        return _bind$8;
      }
      _M0MPC15array5Array4pushGiE(end_points, _tmp$2);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const point_count = _M0MPC15array5Array2atGiE(end_points, contours - 1 | 0) + 1 | 0;
  const _bind$8 = _M0MP312moonbitstack8moonfont5model6Limits14check__outline(limits, point_count, contours);
  if (_bind$8.$tag === 1) {
    const _ok = _bind$8;
    _ok._0;
  } else {
    return _bind$8;
  }
  if (point_count <= 0) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0DTP312moonbitstack8moonfont5table9GlyphData5Empty__);
  }
  const previous = new _M0TPB8MutLocalGiE(-1);
  const _bind$9 = 0;
  let _tmp$2 = _bind$9;
  while (true) {
    const i = _tmp$2;
    if (i < contours) {
      if (_M0MPC15array5Array2atGiE(end_points, i) <= previous.val) {
        return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(10 + (Math.imul(i, 2) | 0) | 0, "contour endpoints that do not increase"));
      }
      previous.val = _M0MPC15array5Array2atGiE(end_points, i);
      _tmp$2 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const _bind$10 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(cursor);
  let instructions;
  if (_bind$10.$tag === 1) {
    const _ok = _bind$10;
    instructions = _ok._0;
  } else {
    return _bind$10;
  }
  const _bind$11 = _M0MP312moonbitstack8moonfont4wire6Cursor4skip(cursor, instructions);
  if (_bind$11.$tag === 1) {
    const _ok = _bind$11;
    _ok._0;
  } else {
    return _bind$11;
  }
  if (point_count > _M0MP312moonbitstack8moonfont4wire6Cursor4left(cursor)) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(_M0MP312moonbitstack8moonfont4wire6Cursor8position(cursor), "more points than bytes remain in the glyph"));
  }
  const _bind$12 = _M0FP312moonbitstack8moonfont5table11read__flags(cursor, point_count);
  let flags;
  if (_bind$12.$tag === 1) {
    const _ok = _bind$12;
    flags = _ok._0;
  } else {
    return _bind$12;
  }
  const _bind$13 = _M0FP312moonbitstack8moonfont5table12read__coords(cursor, flags, true);
  let xs;
  if (_bind$13.$tag === 1) {
    const _ok = _bind$13;
    xs = _ok._0;
  } else {
    return _bind$13;
  }
  const _bind$14 = _M0FP312moonbitstack8moonfont5table12read__coords(cursor, flags, false);
  let ys;
  if (_bind$14.$tag === 1) {
    const _ok = _bind$14;
    ys = _ok._0;
  } else {
    return _bind$14;
  }
  const points = new _M0TPB5ArrayGRP312moonbitstack8moonfont5model5PointE([], 0);
  const on_curve = new _M0TPB5ArrayGbE([], 0);
  const _bind$15 = 0;
  let _tmp$3 = _bind$15;
  while (true) {
    const i = _tmp$3;
    if (i < point_count) {
      _M0MPC15array5Array4pushGlE(points, _M0MP312moonbitstack8moonfont5model5Point2of(_M0MPC15array5Array2atGiE(xs, i), _M0MPC15array5Array2atGiE(ys, i)));
      _M0MPC15array5Array4pushGbE(on_curve, (_M0MPC15array5Array2atGiE(flags, i) & 1) !== 0);
      _tmp$3 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table9GlyphDataRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0DTP312moonbitstack8moonfont5table9GlyphData6Simple(new _M0TP312moonbitstack8moonfont5table11SimpleGlyph(end_points, points, on_curve, bounds)));
}
function _M0FP312moonbitstack8moonfont5table8byte__at(data, at) {
  return at < 0 || at >= _M0MPC15bytes9BytesView6length(data) ? 0 : _M0MPC15bytes9BytesView2at(data, at);
}
function _M0FP312moonbitstack8moonfont5table7u16__at(data, at) {
  return _M0FP312moonbitstack8moonfont5table8byte__at(data, at) << 8 | _M0FP312moonbitstack8moonfont5table8byte__at(data, at + 1 | 0);
}
function _M0FP312moonbitstack8moonfont5table7u32__at(data, at) {
  return _M0FP312moonbitstack8moonfont5table7u16__at(data, at) << 16 | _M0FP312moonbitstack8moonfont5table7u16__at(data, at + 2 | 0);
}
function _M0FP312moonbitstack8moonfont5table4rank(platform, encoding, format) {
  return platform === 3 && (encoding === 10 && format === 12) ? 100 : platform === 0 && format === 12 ? 95 : platform === 3 && (encoding === 10 && format === 4) ? 90 : platform === 3 && (encoding === 1 && format === 4) ? 80 : platform === 0 && format === 4 ? 70 : platform === 3 && (encoding === 0 && format === 4) ? 65 : format === 12 ? 50 : platform === 1 && (encoding === 0 && format === 0) ? 40 : format === 4 ? 30 : format === 6 ? 20 : format === 0 ? 10 : 0;
}
function _M0MP312moonbitstack8moonfont5table4Cmap5parse(cursor, limits) {
  const data = _M0MP312moonbitstack8moonfont4wire6Cursor3all(cursor);
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor7u16__at(cursor, 2);
  let count;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    count = _ok._0;
  } else {
    return _bind;
  }
  if (count <= 0 || count > 4096) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(18);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "cmap numTables of ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, count);
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(2, _M0MPB13StringBuilder10to__string(_string_builder)));
  }
  const best = new _M0TPB8MutLocalGiE(0);
  const chosen = new _M0TPB8MutLocalGiE(-1);
  const format = new _M0TPB8MutLocalGiE(0);
  const broken_offset = new _M0TPB8MutLocalGiE(-1);
  const _bind$2 = 0;
  let _tmp = _bind$2;
  while (true) {
    const i = _tmp;
    if (i < count) {
      const at = 4 + (Math.imul(i, 8) | 0) | 0;
      const platform = _M0FP312moonbitstack8moonfont5table7u16__at(data, at);
      const encoding = _M0FP312moonbitstack8moonfont5table7u16__at(data, at + 2 | 0);
      const offset = _M0FP312moonbitstack8moonfont5table7u32__at(data, at + 4 | 0);
      if (offset < 0 || (offset + 2 | 0) > _M0MPC15bytes9BytesView6length(data)) {
        broken_offset.val = at;
      } else {
        const sub_format = _M0FP312moonbitstack8moonfont5table7u16__at(data, offset);
        const score = _M0FP312moonbitstack8moonfont5table4rank(platform, encoding, sub_format);
        if (score > best.val) {
          best.val = score;
          chosen.val = offset;
          format.val = sub_format;
        }
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  if (chosen.val < 0) {
    if (broken_offset.val >= 0) {
      return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eTruncated(broken_offset.val, 2));
    }
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error55moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnsupported(0, "a cmap with no readable subtable"));
  }
  if (format.val === 4) {
    const seg_count_x2 = _M0FP312moonbitstack8moonfont5table7u16__at(data, chosen.val + 6 | 0);
    if (2 === 0) {
      $panic();
    }
    const segments = seg_count_x2 / 2 | 0;
    const _bind$3 = _M0MP312moonbitstack8moonfont5model6Limits14check__outline(limits, segments, 0);
    if (_bind$3.$tag === 1) {
      const _ok = _bind$3;
      _ok._0;
    } else {
      return _bind$3;
    }
    const end_base = chosen.val + 14 | 0;
    const start_base = (end_base + seg_count_x2 | 0) + 2 | 0;
    const _bind$4 = 0;
    let _tmp$2 = _bind$4;
    while (true) {
      const i = _tmp$2;
      if (i < segments) {
        const first = _M0FP312moonbitstack8moonfont5table7u16__at(data, start_base + (Math.imul(i, 2) | 0) | 0);
        const last = _M0FP312moonbitstack8moonfont5table7u16__at(data, end_base + (Math.imul(i, 2) | 0) | 0);
        if (first > last) {
          return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(start_base + (Math.imul(i, 2) | 0) | 0, "a cmap segment whose startCode exceeds its endCode"));
        }
        _tmp$2 = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
  }
  if (format.val === 12) {
    const groups = _M0FP312moonbitstack8moonfont5table7u32__at(data, chosen.val + 12 | 0);
    if (groups < 0 || groups > 1048576) {
      return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eOverLimit(1048576, groups));
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5table4CmapRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont5table4Cmap(data, chosen.val, format.val));
}
function _M0MP312moonbitstack8moonfont5table4Cmap7format0(self, codepoint) {
  if (codepoint >= 256) {
    return undefined;
  } else {
    const glyph = _M0FP312moonbitstack8moonfont5table8byte__at(self.data, (self.chosen + 6 | 0) + codepoint | 0);
    return glyph === 0 ? undefined : _M0MP312moonbitstack8moonfont5model7GlyphId2of(glyph);
  }
}
function _M0MP312moonbitstack8moonfont5table4Cmap7format4(self, codepoint) {
  const seg_count_x2 = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, self.chosen + 6 | 0);
  if (2 === 0) {
    $panic();
  }
  const segments = seg_count_x2 / 2 | 0;
  if (segments <= 0 || codepoint > 65535) {
    return undefined;
  }
  const end_base = self.chosen + 14 | 0;
  const start_base = (end_base + seg_count_x2 | 0) + 2 | 0;
  const delta_base = start_base + seg_count_x2 | 0;
  const range_base = delta_base + seg_count_x2 | 0;
  const _bind = 0;
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < segments) {
      const last = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, end_base + (Math.imul(i, 2) | 0) | 0);
      if (codepoint <= last) {
        const first = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, start_base + (Math.imul(i, 2) | 0) | 0);
        if (codepoint < first) {
          return undefined;
        }
        const delta = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, delta_base + (Math.imul(i, 2) | 0) | 0);
        const range_offset = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, range_base + (Math.imul(i, 2) | 0) | 0);
        if (range_offset === 0) {
          const glyph = (codepoint + delta | 0) & 65535;
          return glyph === 0 ? undefined : _M0MP312moonbitstack8moonfont5model7GlyphId2of(glyph);
        }
        const at = ((range_base + (Math.imul(i, 2) | 0) | 0) + range_offset | 0) + (Math.imul(2, codepoint - first | 0) | 0) | 0;
        const glyph = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, at);
        if (glyph === 0) {
          return undefined;
        }
        return _M0MP312moonbitstack8moonfont5model7GlyphId2of((glyph + delta | 0) & 65535);
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return undefined;
}
function _M0MP312moonbitstack8moonfont5table4Cmap7format6(self, codepoint) {
  const first = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, self.chosen + 6 | 0);
  const count = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, self.chosen + 8 | 0);
  if (codepoint < first || codepoint >= (first + count | 0)) {
    return undefined;
  }
  const glyph = _M0FP312moonbitstack8moonfont5table7u16__at(self.data, (self.chosen + 10 | 0) + (Math.imul(2, codepoint - first | 0) | 0) | 0);
  return glyph === 0 ? undefined : _M0MP312moonbitstack8moonfont5model7GlyphId2of(glyph);
}
function _M0MP312moonbitstack8moonfont5table4Cmap8format12(self, codepoint) {
  const groups = _M0FP312moonbitstack8moonfont5table7u32__at(self.data, self.chosen + 12 | 0);
  const _bind = 0;
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < groups) {
      const at = (self.chosen + 16 | 0) + (Math.imul(i, 12) | 0) | 0;
      const first = _M0FP312moonbitstack8moonfont5table7u32__at(self.data, at);
      const last = _M0FP312moonbitstack8moonfont5table7u32__at(self.data, at + 4 | 0);
      if (codepoint >= first && codepoint <= last) {
        const start_glyph = _M0FP312moonbitstack8moonfont5table7u32__at(self.data, at + 8 | 0);
        return _M0MP312moonbitstack8moonfont5model7GlyphId2of((start_glyph + codepoint | 0) - first | 0);
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return undefined;
}
function _M0MP312moonbitstack8moonfont5table4Cmap12glyph__index(self, codepoint) {
  if (codepoint < 0 || codepoint > 1114111) {
    return undefined;
  }
  const _bind = self.format;
  switch (_bind) {
    case 0: {
      return _M0MP312moonbitstack8moonfont5table4Cmap7format0(self, codepoint);
    }
    case 4: {
      return _M0MP312moonbitstack8moonfont5table4Cmap7format4(self, codepoint);
    }
    case 6: {
      return _M0MP312moonbitstack8moonfont5table4Cmap7format6(self, codepoint);
    }
    case 12: {
      return _M0MP312moonbitstack8moonfont5table4Cmap8format12(self, codepoint);
    }
    default: {
      return undefined;
    }
  }
}
function _M0FP312moonbitstack8moonfont7outline8midpoint(a, b) {
  if (2 === 0) {
    $panic();
  }
  const _tmp = (a.x + b.x | 0) / 2 | 0;
  if (2 === 0) {
    $panic();
  }
  return _M0MP312moonbitstack8moonfont5model5Point2of(_tmp, (a.y + b.y | 0) / 2 | 0);
}
function _M0FP312moonbitstack8moonfont7outline17contour__commands(points, on_curve, from, to, out) {
  const count = to - from | 0;
  if (count <= 0) {
    return undefined;
  }
  const first_on = _M0MPC15array5Array2atGbE(on_curve, from);
  const last_on = _M0MPC15array5Array2atGbE(on_curve, to - 1 | 0);
  const start = new _M0TPB8MutLocalGRP312moonbitstack8moonfont5model5PointE(_M0MP312moonbitstack8moonfont5model5Point2of(0, 0));
  const begin = new _M0TPB8MutLocalGiE(from);
  const end = new _M0TPB8MutLocalGiE(to);
  if (first_on) {
    start.val = _M0MPC15array5Array2atGlE(points, from);
    begin.val = from + 1 | 0;
  } else {
    if (last_on) {
      start.val = _M0MPC15array5Array2atGlE(points, to - 1 | 0);
      end.val = to - 1 | 0;
    } else {
      start.val = _M0FP312moonbitstack8moonfont7outline8midpoint(_M0MPC15array5Array2atGlE(points, to - 1 | 0), _M0MPC15array5Array2atGlE(points, from));
    }
  }
  _M0MPC15array5Array4pushGlE(out, new _M0DTP312moonbitstack8moonfont5model11PathCommand6MoveTo(start.val));
  const control = new _M0TPB8MutLocalGORP312moonbitstack8moonfont5model5PointE(undefined);
  const _bind = begin.val;
  const _bind$2 = end.val;
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      const point = _M0MPC15array5Array2atGlE(points, i);
      if (_M0MPC15array5Array2atGbE(on_curve, i)) {
        let c;
        _L: {
          _L$2: {
            const _bind$3 = control.val;
            if (_bind$3 === undefined) {
              _M0MPC15array5Array4pushGlE(out, new _M0DTP312moonbitstack8moonfont5model11PathCommand6LineTo(point));
            } else {
              const _Some = _bind$3;
              const _c = _Some;
              c = _c;
              break _L$2;
            }
            break _L;
          }
          _M0MPC15array5Array4pushGlE(out, new _M0DTP312moonbitstack8moonfont5model11PathCommand6QuadTo(c, point));
          control.val = undefined;
        }
      } else {
        let c;
        _L: {
          _L$2: {
            const _bind$3 = control.val;
            if (_bind$3 === undefined) {
            } else {
              const _Some = _bind$3;
              const _c = _Some;
              c = _c;
              break _L$2;
            }
            break _L;
          }
          _M0MPC15array5Array4pushGlE(out, new _M0DTP312moonbitstack8moonfont5model11PathCommand6QuadTo(c, _M0FP312moonbitstack8moonfont7outline8midpoint(c, point)));
        }
        control.val = point;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  let c;
  _L: {
    _L$2: {
      const _bind$3 = control.val;
      if (_bind$3 === undefined) {
      } else {
        const _Some = _bind$3;
        const _c = _Some;
        c = _c;
        break _L$2;
      }
      break _L;
    }
    _M0MPC15array5Array4pushGlE(out, new _M0DTP312moonbitstack8moonfont5model11PathCommand6QuadTo(c, start.val));
  }
  _M0MPC15array5Array4pushGlE(out, _M0DTP312moonbitstack8moonfont5model11PathCommand5Close__);
}
function _M0FP312moonbitstack8moonfont7outline15simple__outline(glyph) {
  const commands = new _M0TPB5ArrayGRP312moonbitstack8moonfont5model11PathCommandE([], 0);
  const from = new _M0TPB8MutLocalGiE(0);
  const _bind = 0;
  const _bind$2 = _M0MPC15array5Array6lengthGiE(glyph.end_points);
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      const to = _M0MPC15array5Array2atGiE(glyph.end_points, i) + 1 | 0;
      if (to > _M0MPC15array5Array6lengthGlE(glyph.points)) {
        break;
      }
      _M0FP312moonbitstack8moonfont7outline17contour__commands(glyph.points, glyph.on_curve, from.val, to, commands);
      from.val = to;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0MP312moonbitstack8moonfont5model7Outline2of(commands, glyph.bounds);
}
function _M0FP312moonbitstack8moonfont7outline16transform__point(point, component) {
  const x = BigInt.asUintN(64, BigInt(point.x));
  const y = BigInt.asUintN(64, BigInt(point.y));
  const a = BigInt.asUintN(64, BigInt(component.a));
  const b = BigInt.asUintN(64, BigInt(component.b));
  const c = BigInt.asUintN(64, BigInt(component.c));
  const d = BigInt.asUintN(64, BigInt(component.d));
  const nx = (Number(BigInt.asIntN(32, BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, x * a) + BigInt.asUintN(64, y * c))) >> BigInt(14 & 63)))) | 0) + component.dx | 0;
  const ny = (Number(BigInt.asIntN(32, BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, x * b) + BigInt.asUintN(64, y * d))) >> BigInt(14 & 63)))) | 0) + component.dy | 0;
  return _M0MP312moonbitstack8moonfont5model5Point2of(nx, ny);
}
function _M0FP312moonbitstack8moonfont7outline18transform__command(command, component) {
  let c2;
  let c1;
  let e;
  _L: {
    let c;
    let e$2;
    _L$2: {
      let p;
      _L$3: {
        let p$2;
        _L$4: {
          switch (command.$tag) {
            case 0: {
              const _MoveTo = command;
              const _p = _MoveTo._0;
              p$2 = _p;
              break _L$4;
            }
            case 1: {
              const _LineTo = command;
              const _p$2 = _LineTo._0;
              p = _p$2;
              break _L$3;
            }
            case 2: {
              const _QuadTo = command;
              const _c = _QuadTo._0;
              const _e = _QuadTo._1;
              c = _c;
              e$2 = _e;
              break _L$2;
            }
            case 3: {
              const _CubicTo = command;
              const _c1 = _CubicTo._0;
              const _c2 = _CubicTo._1;
              const _e$2 = _CubicTo._2;
              c2 = _c2;
              c1 = _c1;
              e = _e$2;
              break _L;
            }
            default: {
              return _M0DTP312moonbitstack8moonfont5model11PathCommand5Close__;
            }
          }
        }
        return new _M0DTP312moonbitstack8moonfont5model11PathCommand6MoveTo(_M0FP312moonbitstack8moonfont7outline16transform__point(p$2, component));
      }
      return new _M0DTP312moonbitstack8moonfont5model11PathCommand6LineTo(_M0FP312moonbitstack8moonfont7outline16transform__point(p, component));
    }
    return new _M0DTP312moonbitstack8moonfont5model11PathCommand6QuadTo(_M0FP312moonbitstack8moonfont7outline16transform__point(c, component), _M0FP312moonbitstack8moonfont7outline16transform__point(e$2, component));
  }
  return new _M0DTP312moonbitstack8moonfont5model11PathCommand7CubicTo(_M0FP312moonbitstack8moonfont7outline16transform__point(c1, component), _M0FP312moonbitstack8moonfont7outline16transform__point(c2, component), _M0FP312moonbitstack8moonfont7outline16transform__point(e, component));
}
function _M0MP312moonbitstack8moonfont7outline11GlyphSource2of(glyf, loca, limits) {
  return new _M0TP312moonbitstack8moonfont7outline11GlyphSource(glyf, loca, limits);
}
function _M0MP312moonbitstack8moonfont7outline11GlyphSource7outline(self, glyph, depth) {
  const level = _M0MPC16option6Option10unwrap__orGiE(depth, 0);
  const _bind = _M0MP312moonbitstack8moonfont5model6Limits12check__depth(self.limits, level);
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  const index = _M0MP312moonbitstack8moonfont5model7GlyphId7to__int(glyph);
  let range;
  const _bind$2 = _M0MP312moonbitstack8moonfont5table4Loca5range(self.loca, index);
  if (_bind$2 === undefined) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error56moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMissingGlyph(index));
  } else {
    const _Some = _bind$2;
    const _value = _Some;
    range = _value;
  }
  let begin;
  let end;
  _L: {
    const _begin = range._0;
    const _end = range._1;
    begin = _begin;
    end = _end;
    break _L;
  }
  if (begin < 0 || (end < begin || end > _M0MPC15bytes9BytesView6length(self.glyf))) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eTruncated(begin, end - begin | 0));
  }
  if (begin === end) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0MP312moonbitstack8moonfont5model7Outline2of(new _M0TPB5ArrayGRP312moonbitstack8moonfont5model11PathCommandE([], 0), _M0MP312moonbitstack8moonfont5model6Bounds5empty()));
  }
  const view = _M0MPC15bytes9BytesView21clamped__view_2einner(self.glyf, begin, end);
  const _bind$3 = _M0MP312moonbitstack8moonfont5table9GlyphData5parse(view, self.limits);
  let data;
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    data = _ok._0;
  } else {
    return _bind$3;
  }
  let composite;
  _L$2: {
    let simple;
    _L$3: {
      switch (data.$tag) {
        case 0: {
          return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0MP312moonbitstack8moonfont5model7Outline2of(new _M0TPB5ArrayGRP312moonbitstack8moonfont5model11PathCommandE([], 0), _M0MP312moonbitstack8moonfont5model6Bounds5empty()));
        }
        case 1: {
          const _Simple = data;
          const _simple = _Simple._0;
          simple = _simple;
          break _L$3;
        }
        default: {
          const _Composite = data;
          const _composite = _Composite._0;
          composite = _composite;
          break _L$2;
        }
      }
    }
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0FP312moonbitstack8moonfont7outline15simple__outline(simple));
  }
  const commands = new _M0TPB5ArrayGRP312moonbitstack8moonfont5model11PathCommandE([], 0);
  const _bind$4 = 0;
  const _bind$5 = _M0MPC15array5Array6lengthGlE(composite.components);
  let _tmp = _bind$4;
  while (true) {
    const i = _tmp;
    if (i < _bind$5) {
      const component = _M0MPC15array5Array2atGlE(composite.components, i);
      const _bind$6 = _M0MP312moonbitstack8moonfont7outline11GlyphSource7outline(self, _M0MP312moonbitstack8moonfont5model7GlyphId2of(component.glyph_index), level + 1 | 0);
      let child;
      if (_bind$6.$tag === 1) {
        const _ok = _bind$6;
        child = _ok._0;
      } else {
        return _bind$6;
      }
      const inner = _M0MP312moonbitstack8moonfont5model7Outline8commands(child);
      const _bind$7 = 0;
      const _bind$8 = _M0MPC15array5Array6lengthGlE(inner);
      let _tmp$2 = _bind$7;
      while (true) {
        const j = _tmp$2;
        if (j < _bind$8) {
          _M0MPC15array5Array4pushGlE(commands, _M0FP312moonbitstack8moonfont7outline18transform__command(_M0MPC15array5Array2atGlE(inner, j), component));
          _tmp$2 = j + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model7OutlineRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0MP312moonbitstack8moonfont5model7Outline2of(commands, composite.bounds));
}
function _M0FP312moonbitstack8moonfont6raster5abs64(value) {
  return BigInt.asIntN(64, value) < BigInt.asIntN(64, 0n) ? BigInt.asUintN(64, -value) : value;
}
function _M0FP312moonbitstack8moonfont6raster10floor__div(value, unit) {
  if (unit === 0n) {
    $panic();
  }
  const quotient = BigInt.asUintN(64, BigInt.asIntN(64, value) / BigInt.asIntN(64, unit));
  if (unit === 0n) {
    $panic();
  }
  const remainder = BigInt.asUintN(64, BigInt.asIntN(64, value) % BigInt.asIntN(64, unit));
  return Number(BigInt.asIntN(32, BigInt.asIntN(64, remainder) < BigInt.asIntN(64, 0n) ? BigInt.asUintN(64, quotient - 1n) : quotient)) | 0;
}
function _M0FP312moonbitstack8moonfont6raster9ceil__div(value, unit) {
  if (unit === 0n) {
    $panic();
  }
  const quotient = BigInt.asUintN(64, BigInt.asIntN(64, value) / BigInt.asIntN(64, unit));
  if (unit === 0n) {
    $panic();
  }
  const remainder = BigInt.asUintN(64, BigInt.asIntN(64, value) % BigInt.asIntN(64, unit));
  return Number(BigInt.asIntN(32, BigInt.asIntN(64, remainder) > BigInt.asIntN(64, 0n) ? BigInt.asUintN(64, quotient + 1n) : quotient)) | 0;
}
function _M0FP312moonbitstack8moonfont6raster5clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}
function _M0FP312moonbitstack8moonfont6raster10to__screen(point, scale) {
  return { _0: BigInt.asUintN(64, BigInt(_M0MP312moonbitstack8moonfont5model5Scale5apply(scale, point.x))), _1: BigInt.asUintN(64, BigInt(-_M0MP312moonbitstack8moonfont5model5Scale5apply(scale, point.y) | 0)) };
}
function _M0FP312moonbitstack8moonfont6raster9add__edge(edges, from, to) {
  let x0;
  let y0;
  _L: {
    const _x0 = from._0;
    const _y0 = from._1;
    x0 = _x0;
    y0 = _y0;
    break _L;
  }
  let x1;
  let y1;
  _L$2: {
    const _x1 = to._0;
    const _y1 = to._1;
    x1 = _x1;
    y1 = _y1;
    break _L$2;
  }
  if (BigInt.asUintN(64, y0) === BigInt.asUintN(64, y1)) {
    return undefined;
  }
  const dir = BigInt.asIntN(64, y0) > BigInt.asIntN(64, y1) ? 1 : -1;
  _M0MPC15array5Array4pushGlE(edges, new _M0TP312moonbitstack8moonfont6raster4Edge(x0, y0, x1, y1, dir));
}
function _M0FP312moonbitstack8moonfont6raster12curve__steps(span) {
  if (128n === 0n) {
    $panic();
  }
  const steps = (Number(BigInt.asIntN(32, BigInt.asUintN(64, BigInt.asIntN(64, span) / BigInt.asIntN(64, 128n)))) | 0) + 1 | 0;
  return _M0FP312moonbitstack8moonfont6raster5clamp(steps, 1, 64);
}
function _M0FP312moonbitstack8moonfont6raster11curve__span(a, b, c) {
  let ax;
  let ay;
  _L: {
    const _ax = a._0;
    const _ay = a._1;
    ax = _ax;
    ay = _ay;
    break _L;
  }
  let bx;
  let by;
  _L$2: {
    const _bx = b._0;
    const _by = b._1;
    bx = _bx;
    by = _by;
    break _L$2;
  }
  let cx;
  let cy;
  _L$3: {
    const _cx = c._0;
    const _cy = c._1;
    cx = _cx;
    cy = _cy;
    break _L$3;
  }
  const span = new _M0TPB8MutLocalGlE(_M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, bx - ax)));
  if (BigInt.asIntN(64, _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, by - ay))) > BigInt.asIntN(64, span.val)) {
    span.val = _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, by - ay));
  }
  if (BigInt.asIntN(64, _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, cx - bx))) > BigInt.asIntN(64, span.val)) {
    span.val = _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, cx - bx));
  }
  if (BigInt.asIntN(64, _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, cy - by))) > BigInt.asIntN(64, span.val)) {
    span.val = _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, cy - by));
  }
  if (BigInt.asIntN(64, _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, cx - ax))) > BigInt.asIntN(64, span.val)) {
    span.val = _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, cx - ax));
  }
  if (BigInt.asIntN(64, _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, cy - ay))) > BigInt.asIntN(64, span.val)) {
    span.val = _M0FP312moonbitstack8moonfont6raster5abs64(BigInt.asUintN(64, cy - ay));
  }
  return span.val;
}
function _M0FP312moonbitstack8moonfont6raster7flatten(outline, scale) {
  const edges = new _M0TPB5ArrayGRP312moonbitstack8moonfont6raster4EdgeE([], 0);
  const commands = _M0MP312moonbitstack8moonfont5model7Outline8commands(outline);
  const zero = 0n;
  const current = new _M0TPB8MutLocalGUllEE({ _0: zero, _1: zero });
  const start = new _M0TPB8MutLocalGUllEE({ _0: zero, _1: zero });
  const _bind = 0;
  const _bind$2 = _M0MPC15array5Array6lengthGlE(commands);
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      let control2;
      let control1;
      let end;
      _L: {
        _L$2: {
          let control;
          let end$2;
          _L$3: {
            _L$4: {
              let p;
              _L$5: {
                _L$6: {
                  let p$2;
                  _L$7: {
                    _L$8: {
                      const _bind$3 = _M0MPC15array5Array2atGlE(commands, i);
                      switch (_bind$3.$tag) {
                        case 0: {
                          const _MoveTo = _bind$3;
                          const _p = _MoveTo._0;
                          p$2 = _p;
                          break _L$8;
                        }
                        case 1: {
                          const _LineTo = _bind$3;
                          const _p$2 = _LineTo._0;
                          p = _p$2;
                          break _L$6;
                        }
                        case 2: {
                          const _QuadTo = _bind$3;
                          const _control = _QuadTo._0;
                          const _end = _QuadTo._1;
                          control = _control;
                          end$2 = _end;
                          break _L$4;
                        }
                        case 3: {
                          const _CubicTo = _bind$3;
                          const _control1 = _CubicTo._0;
                          const _control2 = _CubicTo._1;
                          const _end$2 = _CubicTo._2;
                          control2 = _control2;
                          control1 = _control1;
                          end = _end$2;
                          break _L$2;
                        }
                        default: {
                          _M0FP312moonbitstack8moonfont6raster9add__edge(edges, current.val, start.val);
                          current.val = start.val;
                        }
                      }
                      break _L$7;
                    }
                    current.val = _M0FP312moonbitstack8moonfont6raster10to__screen(p$2, scale);
                    start.val = current.val;
                  }
                  break _L$5;
                }
                const next = _M0FP312moonbitstack8moonfont6raster10to__screen(p, scale);
                _M0FP312moonbitstack8moonfont6raster9add__edge(edges, current.val, next);
                current.val = next;
              }
              break _L$3;
            }
            const p0 = current.val;
            const p1 = _M0FP312moonbitstack8moonfont6raster10to__screen(control, scale);
            const p2 = _M0FP312moonbitstack8moonfont6raster10to__screen(end$2, scale);
            const steps = _M0FP312moonbitstack8moonfont6raster12curve__steps(_M0FP312moonbitstack8moonfont6raster11curve__span(p0, p1, p2));
            let x0;
            let y0;
            _L$5: {
              const _x0 = p0._0;
              const _y0 = p0._1;
              x0 = _x0;
              y0 = _y0;
              break _L$5;
            }
            let x1;
            let y1;
            _L$6: {
              const _x1 = p1._0;
              const _y1 = p1._1;
              x1 = _x1;
              y1 = _y1;
              break _L$6;
            }
            let x2;
            let y2;
            _L$7: {
              const _x2 = p2._0;
              const _y2 = p2._1;
              x2 = _x2;
              y2 = _y2;
              break _L$7;
            }
            const _bind$3 = 1;
            const _bind$4 = steps + 1 | 0;
            let _tmp$2 = _bind$3;
            while (true) {
              const k = _tmp$2;
              if (k < _bind$4) {
                if (steps === 0) {
                  $panic();
                }
                const t = BigInt.asUintN(64, BigInt((Math.imul(k, 64) | 0) / steps | 0));
                const u = BigInt.asUintN(64, 64n - t);
                if (4096n === 0n) {
                  $panic();
                }
                const nx = BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, u * u) * x0) + BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, 2n * u) * t) * x1)) + BigInt.asUintN(64, BigInt.asUintN(64, t * t) * x2))) / BigInt.asIntN(64, 4096n));
                if (4096n === 0n) {
                  $panic();
                }
                const ny = BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, u * u) * y0) + BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, 2n * u) * t) * y1)) + BigInt.asUintN(64, BigInt.asUintN(64, t * t) * y2))) / BigInt.asIntN(64, 4096n));
                const next = { _0: nx, _1: ny };
                _M0FP312moonbitstack8moonfont6raster9add__edge(edges, current.val, next);
                current.val = next;
                _tmp$2 = k + 1 | 0;
                continue;
              } else {
                break;
              }
            }
          }
          break _L;
        }
        const p0 = current.val;
        const p1 = _M0FP312moonbitstack8moonfont6raster10to__screen(control1, scale);
        const p2 = _M0FP312moonbitstack8moonfont6raster10to__screen(control2, scale);
        const p3 = _M0FP312moonbitstack8moonfont6raster10to__screen(end, scale);
        const steps = _M0FP312moonbitstack8moonfont6raster12curve__steps(_M0FP312moonbitstack8moonfont6raster11curve__span(p0, p1, p3));
        let x0;
        let y0;
        _L$3: {
          const _x0 = p0._0;
          const _y0 = p0._1;
          x0 = _x0;
          y0 = _y0;
          break _L$3;
        }
        let x1;
        let y1;
        _L$4: {
          const _x1 = p1._0;
          const _y1 = p1._1;
          x1 = _x1;
          y1 = _y1;
          break _L$4;
        }
        let x2;
        let y2;
        _L$5: {
          const _x2 = p2._0;
          const _y2 = p2._1;
          x2 = _x2;
          y2 = _y2;
          break _L$5;
        }
        let x3;
        let y3;
        _L$6: {
          const _x3 = p3._0;
          const _y3 = p3._1;
          x3 = _x3;
          y3 = _y3;
          break _L$6;
        }
        const _bind$3 = 1;
        const _bind$4 = steps + 1 | 0;
        let _tmp$2 = _bind$3;
        while (true) {
          const k = _tmp$2;
          if (k < _bind$4) {
            if (steps === 0) {
              $panic();
            }
            const t = BigInt.asUintN(64, BigInt((Math.imul(k, 64) | 0) / steps | 0));
            const u = BigInt.asUintN(64, 64n - t);
            if (262144n === 0n) {
              $panic();
            }
            const nx = BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, u * u) * u) * x0) + BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, 3n * u) * u) * t) * x1)) + BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, 3n * u) * t) * t) * x2)) + BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, t * t) * t) * x3))) / BigInt.asIntN(64, 262144n));
            if (262144n === 0n) {
              $panic();
            }
            const ny = BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, u * u) * u) * y0) + BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, 3n * u) * u) * t) * y1)) + BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, 3n * u) * t) * t) * y2)) + BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, t * t) * t) * y3))) / BigInt.asIntN(64, 262144n));
            const next = { _0: nx, _1: ny };
            _M0FP312moonbitstack8moonfont6raster9add__edge(edges, current.val, next);
            current.val = next;
            _tmp$2 = k + 1 | 0;
            continue;
          } else {
            break;
          }
        }
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return edges;
}
function _M0FP312moonbitstack8moonfont6raster15sort__crossings(xs, dirs) {
  const _bind = 1;
  const _bind$2 = _M0MPC15array5Array6lengthGlE(xs);
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      const key_x = _M0MPC15array5Array2atGlE(xs, i);
      const key_d = _M0MPC15array5Array2atGiE(dirs, i);
      const j = new _M0TPB8MutLocalGiE(i - 1 | 0);
      while (true) {
        if (j.val >= 0 && BigInt.asIntN(64, _M0MPC15array5Array2atGlE(xs, j.val)) > BigInt.asIntN(64, key_x)) {
          _M0MPC15array5Array3setGlE(xs, j.val + 1 | 0, _M0MPC15array5Array2atGlE(xs, j.val));
          _M0MPC15array5Array3setGiE(dirs, j.val + 1 | 0, _M0MPC15array5Array2atGiE(dirs, j.val));
          j.val = j.val - 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _M0MPC15array5Array3setGlE(xs, j.val + 1 | 0, key_x);
      _M0MPC15array5Array3setGiE(dirs, j.val + 1 | 0, key_d);
      _tmp = i + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP312moonbitstack8moonfont6raster11empty__mask() {
  return _M0MP312moonbitstack8moonfont5model12CoverageMask2of(0, 0, 0, 0, $makebytes(0, 0));
}
function _M0FP312moonbitstack8moonfont6raster9rasterise(outline, scale, limits) {
  const edges = _M0FP312moonbitstack8moonfont6raster7flatten(outline, scale);
  if (_M0MPC15array5Array6lengthGlE(edges) === 0) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model12CoverageMaskRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0FP312moonbitstack8moonfont6raster11empty__mask());
  }
  const min_x = new _M0TPB8MutLocalGlE(_M0MPC15array5Array2atGlE(edges, 0).x0);
  const max_x = new _M0TPB8MutLocalGlE(_M0MPC15array5Array2atGlE(edges, 0).x0);
  const min_y = new _M0TPB8MutLocalGlE(_M0MPC15array5Array2atGlE(edges, 0).y0);
  const max_y = new _M0TPB8MutLocalGlE(_M0MPC15array5Array2atGlE(edges, 0).y0);
  const _bind = 0;
  const _bind$2 = _M0MPC15array5Array6lengthGlE(edges);
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      const edge = _M0MPC15array5Array2atGlE(edges, i);
      if (BigInt.asIntN(64, edge.x0) < BigInt.asIntN(64, min_x.val)) {
        min_x.val = edge.x0;
      }
      if (BigInt.asIntN(64, edge.x0) > BigInt.asIntN(64, max_x.val)) {
        max_x.val = edge.x0;
      }
      if (BigInt.asIntN(64, edge.x1) < BigInt.asIntN(64, min_x.val)) {
        min_x.val = edge.x1;
      }
      if (BigInt.asIntN(64, edge.x1) > BigInt.asIntN(64, max_x.val)) {
        max_x.val = edge.x1;
      }
      if (BigInt.asIntN(64, edge.y0) < BigInt.asIntN(64, min_y.val)) {
        min_y.val = edge.y0;
      }
      if (BigInt.asIntN(64, edge.y0) > BigInt.asIntN(64, max_y.val)) {
        max_y.val = edge.y0;
      }
      if (BigInt.asIntN(64, edge.y1) < BigInt.asIntN(64, min_y.val)) {
        min_y.val = edge.y1;
      }
      if (BigInt.asIntN(64, edge.y1) > BigInt.asIntN(64, max_y.val)) {
        max_y.val = edge.y1;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const left = _M0FP312moonbitstack8moonfont6raster10floor__div(min_x.val, 64n);
  const top = _M0FP312moonbitstack8moonfont6raster10floor__div(min_y.val, 64n);
  const width = _M0FP312moonbitstack8moonfont6raster9ceil__div(max_x.val, 64n) - left | 0;
  const height = _M0FP312moonbitstack8moonfont6raster9ceil__div(max_y.val, 64n) - top | 0;
  if (width <= 0 || height <= 0) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model12CoverageMaskRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0FP312moonbitstack8moonfont6raster11empty__mask());
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont5model6Limits11check__mask(limits, width, height);
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    _ok._0;
  } else {
    return _bind$3;
  }
  const count = Math.imul(width, height) | 0;
  const accumulated = $make_array_len_and_init(count, 0);
  const samples = $makebytes(count, 0);
  const right_edge = Math.imul(left + width | 0, 64) | 0;
  const _bind$4 = 0;
  let _tmp$2 = _bind$4;
  while (true) {
    const py = _tmp$2;
    if (py < height) {
      const _bind$5 = 0;
      const _bind$6 = 8;
      let _tmp$3 = _bind$5;
      while (true) {
        const sub = _tmp$3;
        if (sub < _bind$6) {
          const y = BigInt.asUintN(64, BigInt(((Math.imul(top + py | 0, 64) | 0) + (Math.imul(sub, 8) | 0) | 0) + 4 | 0));
          const xs = new _M0TPB5ArrayGlE([], 0);
          const dirs = new _M0TPB5ArrayGiE([], 0);
          const _bind$7 = 0;
          const _bind$8 = _M0MPC15array5Array6lengthGlE(edges);
          let _tmp$4 = _bind$7;
          while (true) {
            const i = _tmp$4;
            if (i < _bind$8) {
              const edge = _M0MPC15array5Array2atGlE(edges, i);
              const low = BigInt.asIntN(64, edge.y0) < BigInt.asIntN(64, edge.y1) ? edge.y0 : edge.y1;
              const high = BigInt.asIntN(64, edge.y0) < BigInt.asIntN(64, edge.y1) ? edge.y1 : edge.y0;
              if (BigInt.asIntN(64, y) >= BigInt.asIntN(64, low) && BigInt.asIntN(64, y) < BigInt.asIntN(64, high)) {
                const _tmp$5 = edge.x0;
                const _tmp$6 = BigInt.asUintN(64, edge.y1 - edge.y0);
                if (_tmp$6 === 0n) {
                  $panic();
                }
                const x = BigInt.asUintN(64, _tmp$5 + BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, y - edge.y0) * BigInt.asUintN(64, edge.x1 - edge.x0))) / BigInt.asIntN(64, _tmp$6)));
                _M0MPC15array5Array4pushGlE(xs, x);
                _M0MPC15array5Array4pushGiE(dirs, edge.dir);
              }
              _tmp$4 = i + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _M0FP312moonbitstack8moonfont6raster15sort__crossings(xs, dirs);
          const winding = new _M0TPB8MutLocalGiE(0);
          const _bind$9 = 0;
          const _bind$10 = _M0MPC15array5Array6lengthGlE(xs) - 1 | 0;
          let _tmp$5 = _bind$9;
          while (true) {
            const k = _tmp$5;
            if (k < _bind$10) {
              winding.val = winding.val + _M0MPC15array5Array2atGiE(dirs, k) | 0;
              const xa = _M0MPC15array5Array2atGlE(xs, k);
              const xb = _M0MPC15array5Array2atGlE(xs, k + 1 | 0);
              if (winding.val !== 0 && BigInt.asIntN(64, xb) > BigInt.asIntN(64, xa)) {
                const first = _M0FP312moonbitstack8moonfont6raster5clamp(_M0FP312moonbitstack8moonfont6raster10floor__div(xa, 64n) - left | 0, 0, width - 1 | 0);
                const last = _M0FP312moonbitstack8moonfont6raster5clamp(_M0FP312moonbitstack8moonfont6raster9ceil__div(xb, 64n) - left | 0, 0, width);
                let _tmp$6 = first;
                while (true) {
                  const px = _tmp$6;
                  if (px < last) {
                    const pixel_start = BigInt.asUintN(64, BigInt(Math.imul(left + px | 0, 64) | 0));
                    const pixel_end = BigInt.asUintN(64, pixel_start + 64n);
                    const from = BigInt.asIntN(64, xa) > BigInt.asIntN(64, pixel_start) ? xa : pixel_start;
                    const to = BigInt.asIntN(64, xb) < BigInt.asIntN(64, pixel_end) ? xb : BigInt.asIntN(64, BigInt.asUintN(64, BigInt(right_edge))) < BigInt.asIntN(64, pixel_end) ? BigInt.asUintN(64, BigInt(right_edge)) : pixel_end;
                    const overlap = BigInt.asUintN(64, to - from);
                    if (BigInt.asIntN(64, overlap) > BigInt.asIntN(64, 0n)) {
                      const at = (Math.imul(py, width) | 0) + px | 0;
                      if (at >>> 0 < accumulated.length) {
                        accumulated[at] = (at >>> 0 < accumulated.length ? accumulated[at] : $oob()) + (Number(BigInt.asIntN(32, overlap)) | 0) | 0;
                      } else {
                        $oob();
                      }
                    }
                    _tmp$6 = px + 1 | 0;
                    continue;
                  } else {
                    break;
                  }
                }
              }
              _tmp$5 = k + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _tmp$3 = sub + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp$2 = py + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const _bind$5 = 0;
  let _tmp$3 = _bind$5;
  while (true) {
    const i = _tmp$3;
    if (i < count) {
      if (512n === 0n) {
        $panic();
      }
      const value = BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt(i >>> 0 < accumulated.length ? accumulated[i] : $oob())) * 255n)) / BigInt.asIntN(64, 512n));
      if (i >>> 0 < samples.length) {
        samples[i] = _M0FP312moonbitstack8moonfont6raster5clamp(Number(BigInt.asIntN(32, value)) | 0, 0, 255) & 255;
      } else {
        $oob();
      }
      _tmp$3 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont5model12CoverageMaskRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0MP312moonbitstack8moonfont5model12CoverageMask2of(width, height, left, top, samples));
}
function _M0FP312moonbitstack8moonfont4sfnt9tag__head() {
  return 1751474532;
}
function _M0FP312moonbitstack8moonfont4sfnt9tag__hhea() {
  return 1751672161;
}
function _M0FP312moonbitstack8moonfont4sfnt9tag__maxp() {
  return 1835104368;
}
function _M0FP312moonbitstack8moonfont4sfnt9tag__hmtx() {
  return 1752003704;
}
function _M0FP312moonbitstack8moonfont4sfnt9tag__cmap() {
  return 1668112752;
}
function _M0FP312moonbitstack8moonfont4sfnt9tag__loca() {
  return 1819239265;
}
function _M0FP312moonbitstack8moonfont4sfnt9tag__glyf() {
  return 1735162214;
}
function _M0FP312moonbitstack8moonfont4sfnt9tag__kern() {
  return 1801810542;
}
function _M0FP312moonbitstack8moonfont4sfnt8tag__os2() {
  return 1330851634;
}
function _M0FP312moonbitstack8moonfont4sfnt10sfnt__true() {
  return 65536;
}
function _M0FP312moonbitstack8moonfont4sfnt10sfnt__otto() {
  return 1330926671;
}
function _M0FP312moonbitstack8moonfont4sfnt11sfnt__apple() {
  return 1953658213;
}
function _M0FP312moonbitstack8moonfont4sfnt10sfnt__ttcf() {
  return 1953784678;
}
function _M0FP312moonbitstack8moonfont4sfnt11tag__string(tag) {
  switch (tag) {
    case 1751474532: {
      return "head";
    }
    case 1751672161: {
      return "hhea";
    }
    case 1835104368: {
      return "maxp";
    }
    case 1752003704: {
      return "hmtx";
    }
    case 1668112752: {
      return "cmap";
    }
    case 1819239265: {
      return "loca";
    }
    case 1735162214: {
      return "glyf";
    }
    case 1801810542: {
      return "kern";
    }
    case 1851878757: {
      return "name";
    }
    case 1886352244: {
      return "post";
    }
    case 1330851634: {
      return "OS/2";
    }
    default: {
      return "an unknown table";
    }
  }
}
function _M0MP312moonbitstack8moonfont4sfnt9Directory4find(self, tag) {
  const _bind = 0;
  const _bind$2 = _M0MPC15array5Array6lengthGlE(self.records);
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      if (_M0MPC15array5Array2atGlE(self.records, i).tag === tag) {
        return _M0MPC15array5Array2atGlE(self.records, i);
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return undefined;
}
function _M0MP312moonbitstack8moonfont4sfnt9Directory3has(self, tag) {
  const _bind = _M0MP312moonbitstack8moonfont4sfnt9Directory4find(self, tag);
  return !(_bind === undefined);
}
function _M0MP312moonbitstack8moonfont4sfnt9Directory7require(self, tag) {
  let record;
  _L: {
    const _bind = _M0MP312moonbitstack8moonfont4sfnt9Directory4find(self, tag);
    if (_bind === undefined) {
      return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt11TableRecordRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error56moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMissingTable(_M0FP312moonbitstack8moonfont4sfnt11tag__string(tag)));
    } else {
      const _Some = _bind;
      const _record = _Some;
      record = _record;
      break _L;
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt11TableRecordRP312moonbitstack8moonfont5model7RefusedE2Ok(record);
}
function _M0MP312moonbitstack8moonfont4sfnt9Directory5table(self, bytes, tag, limits) {
  const _bind = _M0MP312moonbitstack8moonfont4sfnt9Directory7require(self, tag);
  let record;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    record = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont5model6Limits12check__table(limits, record.length);
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    _ok._0;
  } else {
    return _bind$2;
  }
  return _M0MP312moonbitstack8moonfont4wire6Cursor6window(_M0MP312moonbitstack8moonfont4wire6Cursor3new(bytes), record.offset, record.length);
}
function _M0FP312moonbitstack8moonfont4sfnt16parse__directory(bytes, at, limits) {
  const root = _M0MP312moonbitstack8moonfont4wire6Cursor3new(bytes);
  const _bind = _M0MP312moonbitstack8moonfont4wire6Cursor6window(root, at, 12);
  let header;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    header = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(header);
  let scaler;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    scaler = _ok._0;
  } else {
    return _bind$2;
  }
  if (scaler !== _M0FP312moonbitstack8moonfont4sfnt10sfnt__true() && (scaler !== _M0FP312moonbitstack8moonfont4sfnt10sfnt__otto() && scaler !== _M0FP312moonbitstack8moonfont4sfnt11sfnt__apple())) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(17);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "sfnt scaler type ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, scaler);
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt9DirectoryRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error51moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnknown(at, _M0MPB13StringBuilder10to__string(_string_builder)));
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3u16(header);
  let count;
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    count = _ok._0;
  } else {
    return _bind$3;
  }
  const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor4skip(header, 6);
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    _ok._0;
  } else {
    return _bind$4;
  }
  if (count <= 0) {
    return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt9DirectoryRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(at + 4 | 0, "an empty table directory"));
  }
  const records = new _M0TPB5ArrayGRP312moonbitstack8moonfont4sfnt11TableRecordE([], 0);
  const _bind$5 = _M0MP312moonbitstack8moonfont4wire6Cursor6window(root, at + 12 | 0, Math.imul(count, 16) | 0);
  let entries;
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    entries = _ok._0;
  } else {
    return _bind$5;
  }
  const _bind$6 = 0;
  let _tmp = _bind$6;
  while (true) {
    const _ = _tmp;
    if (_ < count) {
      const _bind$7 = _M0MP312moonbitstack8moonfont4wire6Cursor3tag(entries);
      let tag;
      if (_bind$7.$tag === 1) {
        const _ok = _bind$7;
        tag = _ok._0;
      } else {
        return _bind$7;
      }
      const _bind$8 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(entries);
      let checksum;
      if (_bind$8.$tag === 1) {
        const _ok = _bind$8;
        checksum = _ok._0;
      } else {
        return _bind$8;
      }
      const _bind$9 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(entries);
      let offset;
      if (_bind$9.$tag === 1) {
        const _ok = _bind$9;
        offset = _ok._0;
      } else {
        return _bind$9;
      }
      const _bind$10 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(entries);
      let length;
      if (_bind$10.$tag === 1) {
        const _ok = _bind$10;
        length = _ok._0;
      } else {
        return _bind$10;
      }
      const _bind$11 = _M0MP312moonbitstack8moonfont5model6Limits12check__table(limits, length);
      if (_bind$11.$tag === 1) {
        const _ok = _bind$11;
        _ok._0;
      } else {
        return _bind$11;
      }
      if (offset < 0 || (length < 0 || (offset + length | 0) > _M0MPC15bytes9BytesView6length(bytes))) {
        return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt9DirectoryRP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eTruncated(offset, length));
      }
      _M0MPC15array5Array4pushGlE(records, new _M0TP312moonbitstack8moonfont4sfnt11TableRecord(tag, checksum, offset, length));
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRP312moonbitstack8moonfont4sfnt9DirectoryRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP312moonbitstack8moonfont4sfnt9Directory(scaler, records));
}
function _M0FP312moonbitstack8moonfont4sfnt4read(bytes, limits) {
  const _bind = _M0MP312moonbitstack8moonfont5model6Limits11check__file(limits, _M0MPC15bytes9BytesView6length(bytes));
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  const root = _M0MP312moonbitstack8moonfont4wire6Cursor3new(bytes);
  const _bind$2 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(root);
  let signature;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    signature = _ok._0;
  } else {
    return _bind$2;
  }
  let _tmp;
  if (signature === _M0FP312moonbitstack8moonfont4sfnt10sfnt__ttcf()) {
    const _bind$3 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(root);
    let version;
    if (_bind$3.$tag === 1) {
      const _ok = _bind$3;
      version = _ok._0;
    } else {
      return _bind$3;
    }
    if (version !== 65536 && version !== 131072) {
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(12);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "TTC version ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder, version);
      return new _M0DTPC16result6ResultGRPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryERP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error55moonbitstack_2fmoonfont_2fmodel_2eRefused_2eUnsupported(4, _M0MPB13StringBuilder10to__string(_string_builder)));
    }
    const _bind$4 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(root);
    let count;
    if (_bind$4.$tag === 1) {
      const _ok = _bind$4;
      count = _ok._0;
    } else {
      return _bind$4;
    }
    if (count <= 0) {
      return new _M0DTPC16result6ResultGRPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryERP312moonbitstack8moonfont5model7RefusedE3Err(new _M0DTPC15error5Error53moonbitstack_2fmoonfont_2fmodel_2eRefused_2eMalformed(8, "an empty collection"));
    }
    const _bind$5 = _M0MP312moonbitstack8moonfont5model6Limits13check__glyphs(limits, count);
    if (_bind$5.$tag === 1) {
      const _ok = _bind$5;
      _ok._0;
    } else {
      return _bind$5;
    }
    const offsets = new _M0TPB5ArrayGiE([], 0);
    const _bind$6 = 0;
    let _tmp$2 = _bind$6;
    while (true) {
      const _ = _tmp$2;
      if (_ < count) {
        const _bind$7 = _M0MP312moonbitstack8moonfont4wire6Cursor3u32(root);
        let _tmp$3;
        if (_bind$7.$tag === 1) {
          const _ok = _bind$7;
          _tmp$3 = _ok._0;
        } else {
          return _bind$7;
        }
        _M0MPC15array5Array4pushGiE(offsets, _tmp$3);
        _tmp$2 = _ + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    const faces = new _M0TPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryE([], 0);
    const _bind$7 = 0;
    const _bind$8 = _M0MPC15array5Array6lengthGiE(offsets);
    let _tmp$3 = _bind$7;
    while (true) {
      const i = _tmp$3;
      if (i < _bind$8) {
        const _bind$9 = _M0FP312moonbitstack8moonfont4sfnt16parse__directory(bytes, _M0MPC15array5Array2atGiE(offsets, i), limits);
        let _tmp$4;
        if (_bind$9.$tag === 1) {
          const _ok = _bind$9;
          _tmp$4 = _ok._0;
        } else {
          return _bind$9;
        }
        _M0MPC15array5Array4pushGlE(faces, _tmp$4);
        _tmp$3 = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    _tmp = faces;
  } else {
    const _bind$3 = _M0FP312moonbitstack8moonfont4sfnt16parse__directory(bytes, 0, limits);
    let _tmp$2;
    if (_bind$3.$tag === 1) {
      const _ok = _bind$3;
      _tmp$2 = _ok._0;
    } else {
      return _bind$3;
    }
    _tmp = new _M0TPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryE([_tmp$2], 1);
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGRP312moonbitstack8moonfont4sfnt9DirectoryERP312moonbitstack8moonfont5model7RefusedE2Ok(_tmp);
}
function _M0FP212moonbitstack8moonfont5build(bytes, directory, limits) {
  const _bind = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt9tag__head(), limits);
  let _tmp;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _tmp = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP312moonbitstack8moonfont5table4Head5parse(_tmp);
  let head;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    head = _ok._0;
  } else {
    return _bind$2;
  }
  const _bind$3 = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt9tag__maxp(), limits);
  let _tmp$2;
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    _tmp$2 = _ok._0;
  } else {
    return _bind$3;
  }
  const _bind$4 = _M0MP312moonbitstack8moonfont5table4Maxp5parse(_tmp$2, limits);
  let maxp;
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    maxp = _ok._0;
  } else {
    return _bind$4;
  }
  const _bind$5 = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt9tag__hhea(), limits);
  let _tmp$3;
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    _tmp$3 = _ok._0;
  } else {
    return _bind$5;
  }
  const _bind$6 = _M0MP312moonbitstack8moonfont5table4Hhea5parse(_tmp$3);
  let hhea;
  if (_bind$6.$tag === 1) {
    const _ok = _bind$6;
    hhea = _ok._0;
  } else {
    return _bind$6;
  }
  const _bind$7 = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt9tag__hmtx(), limits);
  let _tmp$4;
  if (_bind$7.$tag === 1) {
    const _ok = _bind$7;
    _tmp$4 = _ok._0;
  } else {
    return _bind$7;
  }
  const _bind$8 = _M0MP312moonbitstack8moonfont5table4Hmtx5parse(_tmp$4, maxp.num_glyphs, hhea.number_of_h_metrics, limits);
  let hmtx;
  if (_bind$8.$tag === 1) {
    const _ok = _bind$8;
    hmtx = _ok._0;
  } else {
    return _bind$8;
  }
  const _bind$9 = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt9tag__loca(), limits);
  let _tmp$5;
  if (_bind$9.$tag === 1) {
    const _ok = _bind$9;
    _tmp$5 = _ok._0;
  } else {
    return _bind$9;
  }
  const _bind$10 = _M0MP312moonbitstack8moonfont5table4Loca5parse(_tmp$5, maxp.num_glyphs, head.index_to_loc_format, limits);
  let loca;
  if (_bind$10.$tag === 1) {
    const _ok = _bind$10;
    loca = _ok._0;
  } else {
    return _bind$10;
  }
  const _bind$11 = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt9tag__cmap(), limits);
  let _tmp$6;
  if (_bind$11.$tag === 1) {
    const _ok = _bind$11;
    _tmp$6 = _ok._0;
  } else {
    return _bind$11;
  }
  const _bind$12 = _M0MP312moonbitstack8moonfont5table4Cmap5parse(_tmp$6, limits);
  let cmap;
  if (_bind$12.$tag === 1) {
    const _ok = _bind$12;
    cmap = _ok._0;
  } else {
    return _bind$12;
  }
  let kern;
  if (_M0MP312moonbitstack8moonfont4sfnt9Directory3has(directory, _M0FP312moonbitstack8moonfont4sfnt9tag__kern())) {
    const _bind$13 = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt9tag__kern(), limits);
    let _tmp$7;
    if (_bind$13.$tag === 1) {
      const _ok = _bind$13;
      _tmp$7 = _ok._0;
    } else {
      return _bind$13;
    }
    const _bind$14 = _M0MP312moonbitstack8moonfont5table4Kern5parse(_tmp$7, limits);
    if (_bind$14.$tag === 1) {
      const _ok = _bind$14;
      kern = _ok._0;
    } else {
      return _bind$14;
    }
  } else {
    kern = _M0MP312moonbitstack8moonfont5table4Kern5empty();
  }
  let os2;
  if (_M0MP312moonbitstack8moonfont4sfnt9Directory3has(directory, _M0FP312moonbitstack8moonfont4sfnt8tag__os2())) {
    const _bind$13 = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt8tag__os2(), limits);
    let _tmp$7;
    if (_bind$13.$tag === 1) {
      const _ok = _bind$13;
      _tmp$7 = _ok._0;
    } else {
      return _bind$13;
    }
    const _bind$14 = _M0MP312moonbitstack8moonfont5table3Os25parse(_tmp$7);
    if (_bind$14.$tag === 1) {
      const _ok = _bind$14;
      os2 = _ok._0;
    } else {
      return _bind$14;
    }
  } else {
    os2 = _M0MP312moonbitstack8moonfont5table3Os25empty();
  }
  const _bind$13 = _M0MP312moonbitstack8moonfont4sfnt9Directory5table(directory, bytes, _M0FP312moonbitstack8moonfont4sfnt9tag__glyf(), limits);
  let _tmp$7;
  if (_bind$13.$tag === 1) {
    const _ok = _bind$13;
    _tmp$7 = _ok._0;
  } else {
    return _bind$13;
  }
  const glyf = _M0MP312moonbitstack8moonfont4wire6Cursor3all(_tmp$7);
  const source = _M0MP312moonbitstack8moonfont7outline11GlyphSource2of(glyf, loca, limits);
  return new _M0DTPC16result6ResultGRP212moonbitstack8moonfont4FaceRP312moonbitstack8moonfont5model7RefusedE2Ok(new _M0TP212moonbitstack8moonfont4Face(head, hhea, maxp, hmtx, cmap, kern, os2, source, limits));
}
function _M0FP212moonbitstack8moonfont6decode(bytes, limits) {
  const limits$2 = _M0MPC16option6Option10unwrap__orGRP312moonbitstack8moonfont5model6LimitsE(limits, _M0MP312moonbitstack8moonfont5model6Limits7default());
  const _bind = _M0FP312moonbitstack8moonfont4sfnt4read(bytes, limits$2);
  let faces;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    faces = _ok._0;
  } else {
    return _bind;
  }
  return _M0FP212moonbitstack8moonfont5build(bytes, _M0MPC15array5Array2atGlE(faces, 0), limits$2);
}
function _M0MP212moonbitstack8moonfont4Face11num__glyphs(self) {
  return self.maxp.num_glyphs;
}
function _M0MP212moonbitstack8moonfont4Face14units__per__em(self) {
  return self.head.units_per_em;
}
function _M0MP212moonbitstack8moonfont4Face13font__metrics(self) {
  return new _M0TP312moonbitstack8moonfont5model11FontMetrics(self.head.units_per_em, self.hhea.ascender, self.hhea.descender, self.hhea.line_gap, self.os2.cap_height, self.os2.x_height, self.maxp.num_glyphs, self.head.bounding_box);
}
function _M0MP212moonbitstack8moonfont4Face5scale(self, pixels_per_em) {
  return _M0MP312moonbitstack8moonfont5model5Scale2of(pixels_per_em, self.head.units_per_em);
}
function _M0MP212moonbitstack8moonfont4Face12glyph__index(self, codepoint) {
  return _M0MP312moonbitstack8moonfont5table4Cmap12glyph__index(self.cmap, codepoint);
}
function _M0MP212moonbitstack8moonfont4Face7outline(self, glyph) {
  return _M0MP312moonbitstack8moonfont7outline11GlyphSource7outline(self.source, glyph, undefined);
}
function _M0MP212moonbitstack8moonfont4Face9rasterise(self, glyph, pixels_per_em) {
  const _bind = _M0MP212moonbitstack8moonfont4Face7outline(self, glyph);
  let outline;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    outline = _ok._0;
  } else {
    return _bind;
  }
  return _M0FP312moonbitstack8moonfont6raster9rasterise(outline, _M0MP212moonbitstack8moonfont4Face5scale(self, pixels_per_em), self.limits);
}
function _M0FP312moonbitstack8moonfont3web6decode(bytes) {
  return _M0FP212moonbitstack8moonfont6decode(new _M0TPC15bytes9BytesView(bytes, 0, bytes.length), undefined);
}
function _M0FP312moonbitstack8moonfont3web11num__glyphs(face) {
  return _M0MP212moonbitstack8moonfont4Face11num__glyphs(face);
}
function _M0FP312moonbitstack8moonfont3web14units__per__em(face) {
  return _M0MP212moonbitstack8moonfont4Face14units__per__em(face);
}
function _M0FP312moonbitstack8moonfont3web12glyph__index(face, codepoint) {
  let glyph;
  _L: {
    const _bind = _M0MP212moonbitstack8moonfont4Face12glyph__index(face, codepoint);
    if (_bind === undefined) {
      return -1;
    } else {
      const _Some = _bind;
      const _glyph = _Some;
      glyph = _glyph;
      break _L;
    }
  }
  return _M0MP312moonbitstack8moonfont5model7GlyphId7to__int(glyph);
}
function _M0FP312moonbitstack8moonfont3web9rasterise(face, glyph, pixels_per_em) {
  return _M0MP212moonbitstack8moonfont4Face9rasterise(face, _M0MP312moonbitstack8moonfont5model7GlyphId2of(glyph), pixels_per_em);
}
function _M0FP312moonbitstack8moonfont3web13font__metrics(face) {
  return _M0MP212moonbitstack8moonfont4Face13font__metrics(face);
}
function _M0FP312moonbitstack8moonfont3web11build__path(outline) {
  const commands = _M0MP312moonbitstack8moonfont5model7Outline8commands(outline);
  const parts = new _M0TPB5ArrayGsE([], 0);
  const _bind = 0;
  const _bind$2 = _M0MPC15array5Array6lengthGlE(commands);
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      let c2;
      let c1;
      let end;
      _L: {
        _L$2: {
          let control;
          let end$2;
          _L$3: {
            _L$4: {
              let p;
              _L$5: {
                _L$6: {
                  let p$2;
                  _L$7: {
                    _L$8: {
                      const _bind$3 = _M0MPC15array5Array2atGlE(commands, i);
                      switch (_bind$3.$tag) {
                        case 0: {
                          const _MoveTo = _bind$3;
                          const _p = _MoveTo._0;
                          p$2 = _p;
                          break _L$8;
                        }
                        case 1: {
                          const _LineTo = _bind$3;
                          const _p$2 = _LineTo._0;
                          p = _p$2;
                          break _L$6;
                        }
                        case 2: {
                          const _QuadTo = _bind$3;
                          const _control = _QuadTo._0;
                          const _end = _QuadTo._1;
                          control = _control;
                          end$2 = _end;
                          break _L$4;
                        }
                        case 3: {
                          const _CubicTo = _bind$3;
                          const _c1 = _CubicTo._0;
                          const _c2 = _CubicTo._1;
                          const _end$2 = _CubicTo._2;
                          c2 = _c2;
                          c1 = _c1;
                          end = _end$2;
                          break _L$2;
                        }
                        default: {
                          _M0MPC15array5Array4pushGlE(parts, "Z");
                        }
                      }
                      break _L$7;
                    }
                    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(3);
                    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "M ");
                    _M0MPB13StringBuilder13write__objectGiE(_string_builder, p$2.x);
                    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
                    _M0MPB13StringBuilder13write__objectGiE(_string_builder, -p$2.y | 0);
                    _M0MPC15array5Array4pushGlE(parts, _M0MPB13StringBuilder10to__string(_string_builder));
                  }
                  break _L$5;
                }
                const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(3);
                _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "L ");
                _M0MPB13StringBuilder13write__objectGiE(_string_builder, p.x);
                _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
                _M0MPB13StringBuilder13write__objectGiE(_string_builder, -p.y | 0);
                _M0MPC15array5Array4pushGlE(parts, _M0MPB13StringBuilder10to__string(_string_builder));
              }
              break _L$3;
            }
            const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(5);
            _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "Q ");
            _M0MPB13StringBuilder13write__objectGiE(_string_builder, control.x);
            _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
            _M0MPB13StringBuilder13write__objectGiE(_string_builder, -control.y | 0);
            _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
            _M0MPB13StringBuilder13write__objectGiE(_string_builder, end$2.x);
            _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
            _M0MPB13StringBuilder13write__objectGiE(_string_builder, -end$2.y | 0);
            _M0MPC15array5Array4pushGlE(parts, _M0MPB13StringBuilder10to__string(_string_builder));
          }
          break _L;
        }
        const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(7);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "C ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, c1.x);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, -c1.y | 0);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, c2.x);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, -c2.y | 0);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, end.x);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, -end.y | 0);
        _M0MPC15array5Array4pushGlE(parts, _M0MPB13StringBuilder10to__string(_string_builder));
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0MPC15array5Array4joinGsE(parts, new _M0TPC16string10StringView(" ", 0, 1));
}
function _M0FP312moonbitstack8moonfont3web12outline__svg(face, glyph) {
  const _bind = _M0MP212moonbitstack8moonfont4Face7outline(face, _M0MP312moonbitstack8moonfont5model7GlyphId2of(glyph));
  let _tmp;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _tmp = _ok._0;
  } else {
    return _bind;
  }
  return new _M0DTPC16result6ResultGsRP312moonbitstack8moonfont5model7RefusedE2Ok(_M0FP312moonbitstack8moonfont3web11build__path(_tmp));
}
export { _M0FP312moonbitstack8moonfont3web6decode as decode, _M0FP312moonbitstack8moonfont3web11num__glyphs as num_glyphs, _M0FP312moonbitstack8moonfont3web14units__per__em as units_per_em, _M0FP312moonbitstack8moonfont3web12glyph__index as glyph_index, _M0FP312moonbitstack8moonfont3web9rasterise as rasterise, _M0FP312moonbitstack8moonfont3web13font__metrics as font_metrics, _M0FP312moonbitstack8moonfont3web12outline__svg as outline_svg }
//# sourceMappingURL=web.js.map
